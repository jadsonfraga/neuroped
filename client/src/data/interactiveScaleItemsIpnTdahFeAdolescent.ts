import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnTdahFeAdolescentDomains: InteractiveDomainDef[] = [
  {
    "name": "Autopercepção",
    "items": [
      {
        "text": "Sinto que minha mente muda de assunto sem eu querer.",
        "example": "Ex.: começo a pensar no dever e percebo que fui para vários assuntos sem terminar."
      },
      {
        "text": "Demoro a começar mesmo quando sei exatamente o que preciso fazer.",
        "example": "Ex.: fico olhando, organizando detalhes ou adiando por muito tempo."
      },
      {
        "text": "Esqueço combinados ou orientações pouco depois de ouvi-los.",
        "example": "Ex.: concordo com um horário e só lembro quando alguém cobra."
      },
      {
        "text": "Preciso de pressão externa para concluir tarefas.",
        "example": "Ex.: só termino quando o prazo está acabando ou alguém fica me lembrando."
      },
      {
        "text": "Perco-me em tarefas com várias etapas.",
        "example": "Ex.: sei o objetivo, mas não consigo manter a sequência na cabeça."
      },
      {
        "text": "Interrompo porque tenho medo de esquecer o que eu ia dizer.",
        "example": "Ex.: falo por cima dos outros para não perder a ideia."
      },
      {
        "text": "Fico inquieto por dentro mesmo quando pareço parado.",
        "example": "Ex.: sinto necessidade constante de mexer, mudar de assunto ou buscar estímulo."
      },
      {
        "text": "Deixo tarefas importantes para o último momento.",
        "example": "Ex.: trabalhos, estudos ou compromissos ficam acumulados até virar urgência."
      }
    ]
  },
  {
    "name": "Impacto funcional",
    "items": [
      {
        "text": "Minhas dificuldades de atenção ou organização afetam minhas notas.",
        "example": "Ex.: sei o conteúdo, mas esqueço, atraso ou entrego incompleto."
      },
      {
        "text": "Minhas dificuldades geram conflitos frequentes em casa.",
        "example": "Ex.: discussões por horários, tarefas, objetos perdidos ou promessas não cumpridas."
      },
      {
        "text": "Minhas dificuldades prejudicam amizades ou relacionamentos.",
        "example": "Ex.: interrompo, esqueço combinados ou ajo por impulso e depois me arrependo."
      },
      {
        "text": "Minhas dificuldades atrapalham meu sono.",
        "example": "Ex.: perco o horário, fico hiperfocado ou não consigo desacelerar."
      },
      {
        "text": "Minhas dificuldades fazem eu me sentir incapaz ou 'preguiçoso'.",
        "example": "Ex.: penso que não adianta tentar porque sempre atraso ou esqueço."
      },
      {
        "text": "Minhas dificuldades levam a punições ou cobranças frequentes.",
        "example": "Ex.: recebo consequências por algo que esqueci ou não consegui organizar."
      },
      {
        "text": "Minhas dificuldades prejudicam esportes, cursos ou projetos pessoais.",
        "example": "Ex.: abandono atividades, perco horários ou não mantenho treino e prática."
      },
      {
        "text": "Uso telas para escapar de tarefas ou emoções difíceis.",
        "example": "Ex.: entro em jogos ou redes sociais e perco a noção do tempo."
      }
    ]
  },
  {
    "name": "Segurança, prioridades e metas",
    "items": [
      {
        "text": "Nas últimas semanas, pensei que seria melhor não existir, desaparecer ou morrer.",
        "example": "Qualquer resposta positiva exige conversa clínica imediata e avaliação própria de risco.",
        "sentinel": {
          "positiveOptionIndexes": [
            1,
            2,
            3
          ],
          "label": "Ideação de morte ou suicídio"
        }
      },
      {
        "text": "Nas últimas semanas, machuquei-me de propósito ou pensei seriamente em fazer isso.",
        "example": "Qualquer resposta positiva exige avaliação imediata de autolesão, intenção, acesso e proteção.",
        "sentinel": {
          "positiveOptionIndexes": [
            1,
            2,
            3
          ],
          "label": "Autolesão"
        }
      },
      {
        "text": "Qual dificuldade relacionada à atenção, organização ou impulsividade mais atrapalha sua vida hoje?",
        "responseType": "text",
        "placeholder": "Descreva uma situação concreta, onde acontece e qual é a consequência...",
        "maxLength": 900
      },
      {
        "text": "Qual mudança concreta você gostaria de alcançar nos próximos três meses?",
        "responseType": "text",
        "placeholder": "Ex.: entregar tarefas no prazo, discutir menos em casa, dormir em horário regular...",
        "maxLength": 700
      }
    ]
  }
];
