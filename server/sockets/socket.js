const { io } = require('../server');
const { Usuario } = require('../classes/usuarios');
const { crearMensaje } = require('../utils/utilidades');
const usuarios = new Usuario();

io.on('connection', (client) => {
    client.on('entrarChat', (data, callback) => {

        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'
            });
        }

        client.join(data.sala); //entrar a una sala

        usuarios.agregarPersona(client.id, data.nombre, data.sala); //aqui estan todas las personas que estan en el chat

        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonaPorSala(data.sala)); //devulve a tdos las personas conectadas
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Admin', `${data.nombre} se unio`));
        callback(usuarios.getPersonaPorSala(data.sala)); //envio esas personas para el frontEnd(socket-chat.js)
    });

    client.on('crearMensaje', (data, callback) => { //en la data viene toda la info
        let persona = usuarios.getPersona(client.id); // aqui viene toda la info de la persona
        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
        callback(mensaje);

    });
    client.on('disconnect', (data) => { //por si un usuario se desconecta lo eliminamos del chat para que no se acumule si vuelve a conectarse
        let personaBorrada = usuarios.borrarPersona(client.id);
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Admin', `${personaBorrada.nombre} salio`, data.mensaje)); //emite a todos los usuario 
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonaPorSala(personaBorrada.sala));
    });
    //Mensajes Privados(lo que hara el servidor cuando se manda ese mensaje privado)
    client.on('mensajePrivado', (data) => {

        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje)); //broadcast.to(data.para) el para es el id de la persona a la cual yo quiero enviar el mensaje

    });
});