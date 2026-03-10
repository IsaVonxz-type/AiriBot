import type { CacheType, ChatInputCommandInteraction } from 'discord.js'

import { EmbedBuilder } from 'discord.js'

export async function handlePing(interaction: ChatInputCommandInteraction<CacheType>) {
  const sent = await interaction.reply({
    content: 'Pinging...',
    fetchReply: true,
  })

  const latency = sent.createdTimestamp - interaction.createdTimestamp
  const apiLatency = interaction.client.ws.ping

  const embed = new EmbedBuilder()
    .setTitle('🏓 Pong!')
    .setDescription('Estado actual de latencia de Airi')
    .addFields(
      {
        name: '⚡ Latencia del bot',
        value: `\`${latency}ms\``,
        inline: true,
      },
      {
        name: '🌐 Latencia de la API',
        value: `\`${apiLatency}ms\``,
        inline: true,
      },
      {
        name: '🤖 Estado',
        value: apiLatency < 100 ? 'Excelente' : apiLatency < 200 ? 'Estable' : 'Con algo de retraso',
        inline: true,
      },
    )
    .setFooter({
      text: 'Airi • Sistema de respuesta',
    })
    .setTimestamp()

  await interaction.editReply({
    content: '',
    embeds: [embed],
  })
}