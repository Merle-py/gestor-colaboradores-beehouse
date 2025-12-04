// content.config.ts
import { defineContentConfig, defineCollection } from '@nuxt/content'

export default defineContentConfig({
    collections: {
        // Deixe vazio por enquanto, adicionaremos coleções (ex: docs) futuramente
        content: defineCollection({
            type: 'page',
            source: '**/*.md'
        })
    }
})