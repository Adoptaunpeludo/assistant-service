import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import { envs } from '../config/envs';

(async () => {
  await seed();
})();

async function seed() {
  try {
    const client = createClient(envs.SUPABASE_URL, envs.SUPABASE_PRIVATE_KEY);

    //* Read File and Split
    const filePath = path.resolve(__dirname, 'adoptaunpeludo.txt');
    const text = await fs.readFile(filePath, 'utf-8');

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
      // separators: [
      //   '<Inicio>',
      //   '<Usuario Anónimo>',
      //   '<Menu de Navegación>',
      //   '<Detalles de los Animales>',
      //   '<Detalles Ampliados de los Animales>',
      //   '<Asociaciones>',
      //   '<Autenticación y Cuentas>',
      //   '<Creación de Cuentas>',
      //   '<Verificación de Cuentas>',
      //   '<Recuperación de Contraseña>',
      //   '<Inicio de Sesión>',
      //   '<Usuario Autenticado>',
      //   '<Perfil de Usuario>',
      //   '<Detalles del Perfil>',
      //   '<Añadir a Favoritos>',
      //   '<Chat con Protectoras o Asociaciones>',
      //   '<Notificaciones>',
      //   '<Chats>',
      //   '<Gestión de Protectoras o Asociaciones>',
      //   '<Gestión de Anuncios de Adopción>',
      //   '<Eliminación de Cuenta>',
      //   '<Notificaciones por Correo Electrónico>',
      // ],
    });

    const output = await splitter.createDocuments([text]);

    console.log({ output });

    //* Store output in a prisma vector store
    const vectorStore = await SupabaseVectorStore.fromDocuments(
      output,
      new OpenAIEmbeddings(),
      {
        client,
        tableName: 'documents',
        queryName: 'match_documents',
      }
    );
  } catch (err) {
    console.log(err);
  }
}
