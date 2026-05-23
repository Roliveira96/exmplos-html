const MOCK_DATA = [
    {
        id: 'phase-1',
        name: 'Desenvolvimento Inicial',
        icon: '🚀',
        activities: [
            {
                id: 'act-1',
                title: 'Planejar Arquitetura do Banco de Dados',
                description: 'Estruturar tabelas, chaves primárias e relacionamentos primordiais do sistema.',
                assignee: { type: 'team', name: 'Desenvolvimento' },
                priority: 'Alta',
                status: 'Em andamento',
                timeEstimate: '6h',
                tags: ['Database', 'Setup'],
                attachments: ['schema_diagram.pdf'],
                comments: [
                    { id: 'c1', text: 'Estruturação das tabelas de Usuários e Atividades pronta. Falta definir sub-atividades.', author: 'Ana Silva', date: '23/05/2026 10:15' },
                    { id: 'c2', text: 'Perfeito Ana! Vou começar a criar os scripts SQL.', author: 'Bruno Souza', date: '23/05/2026 10:30' }
                ],
                timeLogs: [
                    { id: 't1', time: '01:30:00', note: 'Reunião de alinhamento de banco', date: '23/05/2026 09:30' }
                ],
                subActivities: [
                    {
                        id: 'act-1-sub-1',
                        title: 'Criar Script de Migração Inicial',
                        description: 'Escrever as queries DDL estruturadas em SQL para automação de ambiente.',
                        assignee: { type: 'team', name: 'Desenvolvimento' },
                        priority: 'Média',
                        status: 'A fazer',
                        timeEstimate: '2h',
                        tags: ['SQL'],
                        attachments: [],
                        comments: [],
                        timeLogs: [],
                        subActivities: []
                    }
                ]
            },
            {
                id: 'act-2',
                title: 'Desenhar Mockups de Alta Fidelidade',
                description: 'Prototipar telas utilizando as diretrizes do Design System corporativo.',
                assignee: { type: 'team', name: 'Design UX/UI' },
                priority: 'Média',
                status: 'A fazer',
                timeEstimate: '12h',
                tags: ['Figma', 'UI'],
                attachments: [],
                comments: [
                    { id: 'c3', text: 'Protótipo no Figma iniciado. Usando a paleta Dark Mode.', author: 'Ana Silva', date: '23/05/2026 08:00' }
                ],
                timeLogs: [],
                subActivities: []
            }
        ]
    },
    {
        id: 'phase-2',
        name: 'Implementação e Integração',
        icon: '💻',
        activities: [
            {
                id: 'act-3',
                title: 'Desenvolver Componentes UI Base',
                description: 'Codificar botões, inputs, cards e popovers globais e reutilizáveis.',
                assignee: { type: 'user', name: 'Bruno Souza' },
                priority: 'Alta',
                status: 'A fazer',
                timeEstimate: '8h',
                tags: ['React', 'CSS'],
                attachments: [],
                comments: [],
                timeLogs: [],
                subActivities: [
                    {
                        id: 'act-3-sub-1',
                        title: 'Criar Grid System flexível',
                        description: 'Montar a lógica flexbox/grid responsiva para telas principais.',
                        assignee: { type: 'user', name: 'Carlos Santos' },
                        priority: 'Média',
                        status: 'A fazer',
                        timeEstimate: '3h',
                        tags: ['Layout'],
                        attachments: [],
                        comments: [],
                        timeLogs: [],
                        subActivities: []
                    },
                    {
                        id: 'act-3-sub-2',
                        title: 'Implementar Variáveis de Cor Dark Mode',
                        description: 'Configurar a lista de tokens do design system para o tema escuro.',
                        assignee: { type: 'user', name: 'Ana Silva' },
                        priority: 'Baixa',
                        status: 'Concluído',
                        timeEstimate: '2h',
                        tags: ['Visuals'],
                        attachments: [],
                        comments: [
                            { id: 'c4', text: 'Variáveis integradas no root com sucesso!', author: 'Ana Silva', date: '22/05/2026 17:00' }
                        ],
                        timeLogs: [
                            { id: 't2', time: '02:00:00', note: 'Configurando arquivo root de cores', date: '22/05/2026 15:00' }
                        ],
                        subActivities: []
                    }
                ]
            },
            {
                id: 'act-4',
                title: 'Integração de APIs e Latência',
                description: 'Conectar os endpoints do microserviço de autenticação e monitorar delays.',
                assignee: { type: 'team', name: 'Suporte técnico' },
                priority: 'Crítica',
                status: 'Impedimento',
                timeEstimate: '10h',
                tags: ['API', 'Security'],
                attachments: [],
                comments: [
                    { id: 'c5', text: 'O endpoint de login está retornando erro 504 no ambiente de testes.', author: 'Daniel Rocha', date: '23/05/2026 11:00' }
                ],
                timeLogs: [],
                subActivities: []
            }
        ]
    }
];
