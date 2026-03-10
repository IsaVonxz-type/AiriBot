import type { ChatInputCommandInteraction } from 'discord.js'

import process from 'node:process'

import { EmbedBuilder } from 'discord.js'

export const IA_COMMAND_NAME = 'airi'

// Cambia esto si tu Ollama corre en otra URL
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL

// Modelo por defecto. Puedes cambiarlo a phi3, llama3.2, mistral, etc.
const OLLAMA_MODEL = process.env.OLLAMA_MODEL

// Imagen de Airi para el embed.
// Puedes reemplazarla por una URL tuya o por un attachment más adelante.
const AIRI_IMAGE_URL
  = process.env.AIRI_IMAGE_URL

interface OllamaGenerateResponse {
  model?: string
  response?: string
  done?: boolean
}

async function askOllama(prompt: string): Promise<string> {
  const systemPrompt = [
    'Eres Airi, una asistente amable, útil y natural en Discord.',
    'Responde en español.',
    'Sé clara, directa y conversacional.',
    'Si la pregunta es técnica, explica paso a paso.',
    'No inventes funciones que no existen.',
  ].join(' ')

  const fullPrompt = [
    `Sistema: ${systemPrompt}`,
    '',
    `Usuario: ${prompt}`,
    '',
    'Asistente:',
  ].join('\n')

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: fullPrompt,
      stream: false,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Ollama HTTP ${response.status}: ${text}`)
  }

  const data = (await response.json()) as OllamaGenerateResponse

  if (!data.response || !data.response.trim()) {
    throw new Error('Ollama no devolvió contenido.')
  }

  return data.response.trim()
}

function chunkText(text: string, maxLength = 3800): string[] {
  if (text.length <= maxLength)
    return [text]

  const chunks: string[] = []
  let current = text

  while (current.length > maxLength) {
    let cut = current.lastIndexOf('\n', maxLength)
    if (cut < 1000)
      cut = current.lastIndexOf(' ', maxLength)
    if (cut < 500)
      cut = maxLength

    chunks.push(current.slice(0, cut).trim())
    current = current.slice(cut).trim()
  }

  if (current.length > 0)
    chunks.push(current)

  return chunks
}

export async function handleIaCommand(
  interaction: ChatInputCommandInteraction,
) {
  try {
    const pregunta = interaction.options.getString('pregunta', true).trim()

    if (!pregunta) {
      await interaction.reply({
        content: 'Debes escribir una pregunta.',
        ephemeral: true,
      })
      return
    }

    await interaction.deferReply()

    const respuesta = await askOllama(pregunta)
    const parts = chunkText(respuesta)

    const firstEmbed = new EmbedBuilder()
     .setDescription(parts[0])
     .setFooter({
	text: 'Gracias por usar a Airi.',
     })

     if (AIRI_IMAGE_URL) {
	firstEmbed.setThumbnail(AIRI_IMAGE_URL)
     }

     await interaction.editReply({
	embeds: [firstEmbed],
     })


    // Si la respuesta es muy larga, manda las partes restantes
    for (let i = 1; i < parts.length; i++) {
      const extraEmbed = new EmbedBuilder()
       .setTitle(`Continuación ${i + 1}`)
       .setDescription(parts[i])
       .setFooter({
         text: 'Gracias por usar a Airi.',
       })

    if (AIRI_IMAGE_URL)
      extraEmbed.setThumbnail(AIRI_IMAGE_URL)

    await interaction.followUp({
      embeds: [extraEmbed],
    })
   }
  }
  catch (error) {
    console.error('[airi] Error handling /airi command:', error)

    const message
      = error instanceof Error
        ? `Error ejecutando /airi: ${error.message}`
        : 'Ocurrió un error ejecutando /.'

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: message,
      })
      return
    }

    await interaction.reply({
      content: message,
      ephemeral: true,
    })
  }
}