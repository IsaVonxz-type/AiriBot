import { REST, Routes, SlashCommandBuilder } from 'discord.js'

export * from './airi'
export * from './ping'
export * from './summon'

export async function registerCommands(token: string, clientId: string) {
  const rest = new REST().setToken(token)

  await rest.put(
    Routes.applicationCommands(clientId),
    {
      body: [
        new SlashCommandBuilder()
          .setName('ping')
          .setDescription('Replies with Pong!'),

        new SlashCommandBuilder()
          .setName('summon')
          .setDescription('Summons the bot to your voice channel'),

        new SlashCommandBuilder()
          .setName('airi')
          .setDescription('Habla con Airi usando Ollama')
          .addStringOption(option =>
            option
              .setName('pregunta')
              .setDescription('Qué quieres preguntarle a la AIRI')
              .setRequired(true),
          ),
      ],
    },
  )
}