const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } = require('../utilidades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {
        //console.log('entrarChat:', data);

        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre y la sala son necesarios'
            });
        }

        client.join(data.sala);

        let personas = usuarios.agregarPersona(client.id, data.nombre, data.sala);
        // console.log('personas:', personas);
        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSala(data.sala));
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Administrador', `${data.nombre} Ha entrado el chat`));

        callback(usuarios.getPersonasPorSala(data.sala));

        //console.log('Usuario conectado:', data);

    });

    client.on('crearMensaje', (data, callback) => {

        let persona = usuarios.getPersona(client.id); // Usuarios.getPersona(client.id);
        console.log('Persona desconectada: ', persona);
        //console.log('crearMensaje-data:', data);
        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        //console.log('Socket CrearMensaje:', data);
        console.log('CrearMensaje-Server:', mensaje);
        console.log('DatosPersona', persona);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

        callback(mensaje);

    });

    client.on('disconnect', () => {
        // console.log('DatosClienteDesconectado:', client);
        // console.log('Desconectado:', client.id);
        let personaBorrada = usuarios.borrarPersona(client.id);
        // console.log('PersonaBorrada:', personaBorrada);
        //const mesg = { usuario: 'Administrador', mensaje: `${personaBorrada} Ha abandonado el chat` };
        // const mesg = { usuario: 'Administrador', mensaje: personaBorrada.nombre + ' Ha abandonado el chat' };
        // console.log('msg:', mesg);
        //client.broadcast.emit('crearMensaje', { usuario: 'Administrador', mensaje: `${personaBorrada.nombre} Ha abandonado el chat` });
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} Ha abandonado el chat`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
        //console.log('Se ha desconectado', personaBorrada);
    });

    // mensajes privados
    client.on('mensajePrivado', (data) => {

        let persona = usuarios.getPersona(client.id);
        console.log('mensajePrivado: data', data);
        console.log('mensajePrivado.persona:', persona);
        if (!persona) return;
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));

    });


});