# Servicio de Asistente por IA para adoptaunpeludo.com

## Descripción

Este servicio proporciona un Asistente por Inteligencia Artificial (IA) para interactuar con los usuarios de adoptaunpeludo.com. Utiliza modelos de IA para responder preguntas, gestionar chats y mantener la memoria de las interacciones anteriores. El servicio se integra con la infraestructura existente de adoptaunpeludo.com y utiliza tecnologías como RabbitMQ, MongoDB y Supabase.

## Funcionalidades

El servicio de Asistente por IA ofrece las siguientes funcionalidades:

- **Creación de chat**: Permite a los usuarios iniciar una sesión de chat con el asistente de IA.
- **Envío de preguntas**: Los usuarios pueden enviar preguntas al asistente, que responderá en tiempo real.
- **Historial de chat**: Guarda un historial de las interacciones de chat de cada usuario.
- **Borrado de historial de chat**: Los usuarios pueden eliminar su historial de chat.

## Autenticación y Autorización

El servicio gestiona la autenticación de los usuarios a través del middleware `AuthMiddleware`. Este middleware verifica la presencia y validez del token JWT en las solicitudes entrantes y establece el usuario autenticado en el objeto `req.user` para su posterior uso en las rutas protegidas.

Para autorizar el acceso a recursos específicos, se puede utilizar el middleware `authorizePermissions`, que acepta una lista de roles permitidos y verifica si el usuario actual tiene alguno de esos roles.

## Middleware de Manejo de Errores

El servicio utiliza el middleware `ErrorHandlerMiddleware` para manejar errores de manera centralizada. Este middleware intercepta errores en las rutas y envía mensajes de notificación a la cola de RabbitMQ "error-notification" para su posterior procesamiento. Además, devuelve una respuesta JSON con el código de estado y el mensaje de error correspondientes.

## Enviando Mensajes a la Cola "error-notification"

Para enviar mensajes a la cola "error-notification" en RabbitMQ, el servicio utiliza la clase `QueueService`. Esta clase establece una conexión con el servidor RabbitMQ y publica mensajes en la cola especificada. Los mensajes se envían en formato JSON y pueden contener información sobre el error, como el mensaje, el nivel de gravedad y el origen.

## Dependencias

Este servicio utiliza las siguientes dependencias principales:

- **Express**: Para la creación de la API y el manejo de solicitudes HTTP.
- **OpenAI**: Para acceder a modelos de lenguaje natural y generar respuestas inteligentes.
- **Supabase**: Para el almacenamiento de vectores y la gestión de datos.
- **RabbitMQ**: Para la comunicación asincrónica y la gestión de colas.
- **MongoDB**: Para el almacenamiento de datos relacionados con el historial de chat.
- **LangChain**: Framework para desarrollar aplicaciones impulsadas por modelos de lenguaje natural de gran tamaño (LLMs).

## Instalación

Para configurar y ejecutar este servicio, sigue estos pasos:

1. Clona el repositorio y navega al directorio:
    ```bash
    git clone https://github.com/Adoptaunpeludo/assistant-service
    cd assistant-service
    ```

2. Instala las dependencias:
    ```bash
    npm install
    ```

3. Configura las variables de entorno. Copia el archivo `.env.template` y renómbralo a `.env`, luego configura las variables según sea necesario:

    ```plaintext
    PORT=<puerto_del_servicio>

    # Supabase
    SUPABASE_URL=<URL_de_Supabase>
    SUPABASE_PRIVATE_KEY=<clave_privada_de_Supabase>

    # OpenAI
    OPENAI_API_KEY=<clave_de_API_de_OpenAI>

    # MongoDB
    MONGO_DB_URL=<URL_de_MongoDB>

    # RabbitMQ
    RABBITMQ_URL=<URL_de_RabbitMQ>

    PORT=<puerto del servicio>

    DOCUMENT_NAME=<nombre del documento a almacenar en supabase para las consultas>
    ```
    
4. Ejecuta el seed
   
    ```bash
    npm run seed
    ```

5. Arranca la aplicación en modo desarrollo:
   
    ```bash
    npm run dev
    ```

6. Para ejecutar el servicio en modo producción, primero construye el proyecto y luego arráncalo:
   
    ```bash
    npm run build
    npm run start:prod
    ```



