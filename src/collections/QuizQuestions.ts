import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

export const QuizQuestions: CollectionConfig = {
  slug: 'quiz-questions',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'questionText',
    defaultColumns: ['questionText', 'questionType', 'orderIndex'],
  },
  fields: [
    {
      name: 'questionText',
      type: 'text',
      required: true,
      label: 'Текст вопроса',
    },
    {
      name: 'questionType',
      type: 'select',
      required: true,
      label: 'Тип вопроса',
      options: [
        { label: 'Текст', value: 'text' },
        { label: 'Число', value: 'number' },
        { label: 'Выбор', value: 'select' },
        { label: 'Множественный выбор', value: 'multiselect' },
        { label: 'Да/Нет', value: 'boolean' },
      ],
    },
    {
      name: 'options',
      type: 'json',
      label: 'Варианты ответа',
      defaultValue: [],
    },
    {
      name: 'units',
      type: 'json',
      label: 'Единицы измерения',
      defaultValue: [],
    },
    {
      name: 'orderIndex',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Порядок',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isRequired',
      type: 'checkbox',
      defaultValue: true,
      label: 'Обязательный',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
