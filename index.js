const express = require('express');
const path = require('path');
const app = express();
const PORT = 8090;


const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let dominantColor, secondaryColor, servers, users, dateCreate, dateDaysAgo, inviteLink;

client.once('ready', async () => {
    console.log(`✅ Bot está online como ${client.user.tag}`);
    servers = client.guilds.cache.size
    users = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    inviteLink = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=1759218604441591&integration_type=0&scope=applications.commands+bot`
    if(client.user.avatar){
        const imageURL = client.user.avatarURL({ extension: "png", size: 1024 })
        const colors = await getDominantColorFromURL(imageURL);
        dominantColor = colors.dominantColor
        secondaryColor = colors.secondaryColor
    }
    const date = new Date(client.user.createdAt);

    const formattedDate = new Intl.DateTimeFormat('pt-BR').format(date);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    dateCreate = formattedDate
    dateDaysAgo = diffDays
});

client.login(process.env.TOKEN);

// Configurar o EJS como template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal
app.get('/', (req, res) => {
    res.render('index', { 
        clientName: client.user.username,
        clientAvatar: client.user.avatarURL({ extension: "png", size: 1024 }),
        dominantColor,
        secondaryColor,
        isDarkColorPrimary: isDarkColor(dominantColor),
        isDarkColorSecondary: isDarkColor(secondaryColor),
        servers,
        users,
        dateCreate,
        dateDaysAgo,
        inviteLink,
        serverSupportLinkHas: !!process.env.SERVER_SUPPORT_LINK,
        serverSupportLink: process.env.SERVER_SUPPORT_LINK,
        
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});


const axios = require('axios');
const getColors = require('get-image-colors');
const fs = require('fs-extra');

async function getDominantColorFromURL(imageUrl) {
    const tempPath = path.join(__dirname, 'temp.png');

    try {
        // Baixar a imagem
        const response = await axios({
            url: imageUrl,
            responseType: 'arraybuffer'
        });
        await fs.writeFile(tempPath, response.data);

        // Processar a imagem
        const colors = await getColors(tempPath);
        
        const secondaryColor = colors[1].hex();
        const dominantColor = colors[0].hex();

        console.log(`Cor predominante: ${dominantColor}`);

        // Remover a imagem temporária
        await fs.unlink(tempPath);

        return {dominantColor, secondaryColor};
    } catch (error) {
        console.error('Erro ao processar a imagem:', error);
    }
}

function isDarkColor(hex) {
    if(!hex){
        return false
    }
    // Remover o "#" se existir
    hex = hex.replace(/^#/, '');

    // Converter HEX para RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Calcular luminância
    let luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);

    return luminance < 128; // true se for escura, false se for clara
}