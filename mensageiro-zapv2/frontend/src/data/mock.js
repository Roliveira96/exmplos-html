export const contacts = [
    {
        id: 1,
        name: "Grupo da Família",
        avatar: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmFtaWx5JTIwZ3JvdXB8ZW58MHx8MHx8fDA%3D",
        lastMessage: "Mãe: O almoço está pronto!",
        time: "12:30",
        type: "group",
        unread: 2,
        online: true
    },
    {
        id: 2,
        name: "João Silva",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fHBlcnNvbnxlbnwwfHwwfHx8MA%3D%3D",
        lastMessage: "E aí, tudo certo pro futebol?",
        time: "11:45",
        type: "user",
        unread: 0,
        online: true
    },
    {
        id: 3,
        name: "Equipe de Dev",
        avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dGVhbXxlbnwwfHwwfHx8MA%3D%3D",
        lastMessage: "Carlos: O deploy foi feito com sucesso.",
        time: "Ontem",
        type: "group",
        unread: 5,
        online: false
    },
    {
        id: 4,
        name: "Maria Oliveira",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D",
        lastMessage: "Obrigada pela ajuda!",
        time: "Ontem",
        type: "user",
        unread: 0,
        online: false
    },
    {
        id: 5,
        name: "Ana Costa",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D",
        lastMessage: "Me envia o relatório?",
        time: "Segunda",
        type: "user",
        unread: 1,
        online: true
    }
];

export const messages = {
    1: [
        { id: 1, sender: "Tia Ana", text: "Bom dia família! ☀️", time: "08:00", isMe: false },
        { id: 2, sender: "Eu", text: "Bom dia!", time: "08:05", isMe: true },
        { id: 3, sender: "Mãe", text: "O almoço está pronto! Venham comer 🍝", time: "12:30", isMe: false }
    ],
    2: [
        { id: 1, sender: "João Silva", text: "E aí, tudo certo pro futebol hoje a noite?", time: "11:45", isMe: false },
        { id: 2, sender: "Eu", text: "Opa, confirmado! Levo a bola. ⚽", time: "11:50", isMe: true }
    ],
    3: [
        { id: 1, sender: "Carlos", text: "Pessoal, atenção no PR #304.", time: "10:00", isMe: false },
        { id: 2, sender: "Eu", text: "Vou verificar agora.", time: "10:15", isMe: true },
        { id: 3, sender: "Carlos", text: "O deploy foi feito com sucesso. 🚀", time: "17:00", isMe: false }
    ],
    4: [
        { id: 1, sender: "Eu", text: "Segue o arquivo em anexo.", time: "14:00", isMe: true },
        { id: 2, sender: "Maria Oliveira", text: "Obrigada pela ajuda! Você me salvou.", time: "14:05", isMe: false }
    ],
    5: [
        { id: 1, sender: "Ana Costa", text: "Oi, você conseguiu terminar aquele relatório?", time: "09:30", isMe: false },
        { id: 2, sender: "Eu", text: "Estou finalizando.", time: "09:35", isMe: true },
        { id: 3, sender: "Ana Costa", text: "Me envia assim que puder?", time: "09:36", isMe: false }
    ]
};
