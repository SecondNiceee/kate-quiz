/**
 * Загружает дамп `start.sql` в базу данных из POSTGRES_URL.
 *
 * Запуск:
 *   pnpm run setup            — залить дамп (только если база пустая)
 *   pnpm run setup:force      — сбросить схему public и залить дамп заново
 *
 * Скрипт не требует установленного psql: дамп разбирается вручную,
 * блоки `COPY ... FROM stdin` превращаются в параметризованные INSERT.
 */

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'
import pg from 'pg'

const ROOT = process.cwd()
const DUMP_PATH = path.join(ROOT, 'start.sql')
const BATCH_SIZE = 250

const FORCE =
  process.argv.slice(2).includes('--force') ||
  ['1', 'true', 'yes'].includes(String(process.env.SETUP_FORCE || '').toLowerCase())

/* -------------------------------------------------------------------------- */
/*                            Переменные окружения                            */
/* -------------------------------------------------------------------------- */

for (const file of ['.env', '.env.local', '.env.development.local']) {
  const full = path.join(ROOT, file)
  if (existsSync(full)) dotenv.config({ path: full, override: false })
}

const CONNECTION_STRING =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  ''

/* -------------------------------------------------------------------------- */
/*                                  Хелперы                                   */
/* -------------------------------------------------------------------------- */

const log = (msg) => console.log(msg)
const fail = (msg) => {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

function needsSsl(connectionString) {
  try {
    const { hostname, searchParams } = new URL(connectionString)
    if (searchParams.get('sslmode') === 'disable') return false
    return !['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname)
  } catch {
    return false
  }
}

/** Раскодирует одно поле из текстового формата COPY. */
function unescapeCopyValue(value) {
  if (value === '\\N') return null
  if (!value.includes('\\')) return value

  let out = ''
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (char !== '\\') {
      out += char
      continue
    }
    const next = value[++i]
    switch (next) {
      case 'b':
        out += '\b'
        break
      case 'f':
        out += '\f'
        break
      case 'n':
        out += '\n'
        break
      case 'r':
        out += '\r'
        break
      case 't':
        out += '\t'
        break
      case 'v':
        out += '\v'
        break
      case '\\':
        out += '\\'
        break
      case 'x': {
        const hex = value.slice(i + 1, i + 3).match(/^[0-9a-fA-F]{1,2}/)
        if (hex) {
          out += String.fromCharCode(parseInt(hex[0], 16))
          i += hex[0].length
        } else {
          out += 'x'
        }
        break
      }
      default: {
        const octal = value.slice(i).match(/^[0-7]{1,3}/)
        if (octal) {
          out += String.fromCharCode(parseInt(octal[0], 8))
          i += octal[0].length - 1
        } else {
          out += next ?? ''
        }
      }
    }
  }
  return out
}

/**
 * Проверяет, закончилось ли SQL-выражение (`;` вне строк, комментариев
 * и dollar-quoted блоков). Состояние переносится между строками файла.
 */
function scanStatement(text, state) {
  let i = 0
  while (i < text.length) {
    if (state.inLineComment) {
      // однострочный комментарий живёт до конца строки
      return -1
    }
    if (state.inBlockComment) {
      const end = text.indexOf('*/', i)
      if (end === -1) return -1
      state.inBlockComment = false
      i = end + 2
      continue
    }
    if (state.dollarTag) {
      const end = text.indexOf(state.dollarTag, i)
      if (end === -1) return -1
      i = end + state.dollarTag.length
      state.dollarTag = null
      continue
    }
    if (state.inString) {
      const quoteIndex = text.indexOf("'", i)
      if (quoteIndex === -1) return -1
      if (text[quoteIndex + 1] === "'") {
        i = quoteIndex + 2
        continue
      }
      state.inString = false
      i = quoteIndex + 1
      continue
    }
    if (state.inIdentifier) {
      const quoteIndex = text.indexOf('"', i)
      if (quoteIndex === -1) return -1
      state.inIdentifier = false
      i = quoteIndex + 1
      continue
    }

    const char = text[i]
    const pair = text.slice(i, i + 2)

    if (pair === '--') return -1
    if (pair === '/*') {
      state.inBlockComment = true
      i += 2
      continue
    }
    if (char === "'") {
      state.inString = true
      i += 1
      continue
    }
    if (char === '"') {
      state.inIdentifier = true
      i += 1
      continue
    }
    if (char === '$') {
      const tag = text.slice(i).match(/^\$[A-Za-z_0-9]*\$/)
      if (tag) {
        state.dollarTag = tag[0]
        i += tag[0].length
        continue
      }
    }
    if (char === ';') return i
    i += 1
  }
  return -1
}

function newScanState() {
  return {
    inString: false,
    inIdentifier: false,
    inBlockComment: false,
    inLineComment: false,
    dollarTag: null,
  }
}

const quoteIdent = (name) => `"${name.replace(/"/g, '""')}"`

/* -------------------------------------------------------------------------- */
/*                          Разбор и заливка дампа                            */
/* -------------------------------------------------------------------------- */

/**
 * Разбирает plain-дамп pg_dump и применяет его через переданный клиент.
 * Экспортируется отдельно, чтобы логику можно было протестировать.
 */
export async function applyDump(client, dumpText) {
  const lines = dumpText.split('\n')

  let buffer = ''
  let state = newScanState()
  let copyTarget = null // { table, columns }
  let copyRows = []
  let statements = 0
  let insertedRows = 0

  const flushCopyRows = async () => {
    if (!copyRows.length) return
    const cols = copyTarget.columns
    const placeholders = []
    const values = []
    copyRows.forEach((row, rowIndex) => {
      placeholders.push(
        `(${cols.map((_, colIndex) => `$${rowIndex * cols.length + colIndex + 1}`).join(', ')})`,
      )
      values.push(...row)
    })
    await client.query(
      `INSERT INTO ${copyTarget.table} (${cols.map(quoteIdent).join(', ')}) VALUES ${placeholders.join(', ')}`,
      values,
    )
    insertedRows += copyRows.length
    copyRows = []
  }

  const runStatement = async (statement) => {
    try {
      await client.query(statement)
      statements += 1
    } catch (error) {
      throw new Error(`Ошибка при выполнении:\n${statement.slice(0, 300)}\n\n${error.message}`)
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')

    /* ----------------------------- данные COPY ----------------------------- */
    if (copyTarget) {
      if (line === '\\.') {
        await flushCopyRows()
        copyTarget = null
        continue
      }
      const row = line.split('\t').map(unescapeCopyValue)
      if (row.length !== copyTarget.columns.length) {
        throw new Error(
          `Неверное число колонок для ${copyTarget.table}: ожидалось ${copyTarget.columns.length}, получено ${row.length}`,
        )
      }
      copyRows.push(row)
      if (copyRows.length >= BATCH_SIZE) await flushCopyRows()
      continue
    }

    /* -------------------- мета-команды psql и комментарии ------------------- */
    if (!buffer.trim() && (line.startsWith('\\') || line.trim().startsWith('--') || !line.trim())) {
      continue
    }

    buffer += (buffer ? '\n' : '') + line
    let scanned = line
    let end = scanStatement(scanned, state)

    while (end !== -1) {
      // отрезаем законченное выражение от буфера
      const tailStart = buffer.length - scanned.length + end + 1
      const statement = buffer.slice(0, tailStart).trim()
      const rest = buffer.slice(tailStart)
      buffer = ''
      state = newScanState()

      const copyMatch = statement.match(/^COPY\s+([^\s(]+)\s*\(([^)]*)\)\s+FROM\s+stdin\s*;$/is)

      if (copyMatch) {
        copyTarget = {
          table: copyMatch[1],
          columns: copyMatch[2].split(',').map((c) => c.trim().replace(/^"|"$/g, '')),
        }
      } else if (statement.replace(/;$/, '').trim()) {
        await runStatement(statement)
      }

      if (copyTarget || !rest.trim() || rest.trim().startsWith('--')) break
      buffer = rest
      scanned = rest
      end = scanStatement(rest, state)
    }
  }

  if (buffer.trim() && buffer.trim() !== ';') await runStatement(buffer)

  return { statements, insertedRows }
}

/* -------------------------------------------------------------------------- */
/*                                   Основное                                 */
/* -------------------------------------------------------------------------- */

async function main() {
  if (!CONNECTION_STRING) {
    fail(
      'Не найдена строка подключения к базе данных.\n' +
        '  Скопируйте .env.example в .env и заполните POSTGRES_URL.',
    )
  }
  if (!existsSync(DUMP_PATH)) fail(`Файл дампа не найден: ${DUMP_PATH}`)

  const client = new pg.Client({
    connectionString: CONNECTION_STRING,
    ssl: needsSsl(CONNECTION_STRING) ? { rejectUnauthorized: false } : undefined,
    // Дамп может содержать долгие DDL-операции
    statement_timeout: 0,
  })

  log('→ Подключаюсь к базе данных...')
  await client.connect()

  try {
    const { rows } = await client.query(
      `SELECT count(*)::int AS count
         FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    )
    const existingTables = rows[0].count

    if (existingTables > 0 && !FORCE) {
      console.error(
        `\n✖ В схеме "public" уже есть таблицы (${existingTables}). Дамп не залит, чтобы не потерять данные.\n` +
          '  Если нужно перезалить базу с нуля, выполните:\n\n' +
          '    pnpm run setup:force\n\n' +
          '  ВНИМАНИЕ: это удалит схему "public" вместе со всеми данными.\n',
      )
      process.exit(1)
    }

    if (existingTables > 0 && FORCE) {
      log(`→ --force: сбрасываю схему "public" (таблиц: ${existingTables})...`)
      await client.query('DROP SCHEMA IF EXISTS public CASCADE')
      await client.query('CREATE SCHEMA public')
    }

    log('→ Читаю start.sql и заливаю дамп...')
    await client.query('BEGIN')

    const { statements, insertedRows } = await applyDump(client, readFileSync(DUMP_PATH, 'utf8'))

    await client.query('COMMIT')
    log(`\n✔ Готово. Выполнено выражений: ${statements}, вставлено строк: ${insertedRows}.`)
    log('  Дальше: pnpm i && pnpm build && pnpm start')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(`\n✖ Не удалось залить дамп:\n${error.message}\n`)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

// Запускаем только при прямом вызове скрипта (не при импорте в тестах)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => fail(error.message))
}
