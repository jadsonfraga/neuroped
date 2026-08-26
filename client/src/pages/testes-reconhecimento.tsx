import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Star,
  User,
  ArrowLeft,
} from "lucide-react";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";

// ─── Types ────────────────────────────────────────────────────────────────────

type AgeGroup = "2-3" | "3-4" | "4-5" | "5-6" | "6-7";
type Score = 0 | 1 | 2;

interface TestItem {
  id: string;
  emoji: string;
  label: string;
  instruction: string;
}

type DomainKey = "cores" | "letras" | "animais" | "corpo";

interface DomainDef {
  key: DomainKey;
  title: string;
  emoji: string;
  items: TestItem[];
}

// ─── Data Definitions ─────────────────────────────────────────────────────────

const DOMAIN_DEFS: Record<AgeGroup, DomainDef[]> = {
  "2-3": [
    {
      key: "cores",
      title: "Cores",
      emoji: "🎨",
      items: [
        {
          id: "c1",
          emoji: "🔴",
          label: "Vermelho",
          instruction: "Mostre algo vermelho e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c2",
          emoji: "🔵",
          label: "Azul",
          instruction: "Mostre algo azul e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c3",
          emoji: "🟡",
          label: "Amarelo",
          instruction: "Mostre algo amarelo e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c4",
          emoji: "🟢",
          label: "Verde",
          instruction: "Mostre algo verde e pergunte: 'Que cor é essa?'",
        },
      ],
    },
    {
      key: "letras",
      title: "Letras",
      emoji: "🔤",
      items: [
        {
          id: "l1",
          emoji: "🅰️",
          label: "Letra A",
          instruction: "Mostre a letra A maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l2",
          emoji: "⭕",
          label: "Letra O",
          instruction: "Mostre a letra O maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l3",
          emoji: "🅱️",
          label: "Letra B",
          instruction: "Mostre a letra B maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l4",
          emoji: "Ⓜ️",
          label: "Letra M",
          instruction: "Mostre a letra M maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l5",
          emoji: "🅿️",
          label: "Letra P",
          instruction: "Mostre a letra P maiúscula e pergunte: 'O que é isso?'",
        },
      ],
    },
    {
      key: "animais",
      title: "Animais",
      emoji: "🐾",
      items: [
        {
          id: "a1",
          emoji: "🐱",
          label: "Gato",
          instruction:
            "Mostre a figura de um gato e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a2",
          emoji: "🐶",
          label: "Cachorro",
          instruction:
            "Mostre a figura de um cachorro e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a3",
          emoji: "🐦",
          label: "Pássaro",
          instruction:
            "Mostre a figura de um pássaro e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a4",
          emoji: "🐟",
          label: "Peixe",
          instruction:
            "Mostre a figura de um peixe e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a5",
          emoji: "🐄",
          label: "Vaca",
          instruction:
            "Mostre a figura de uma vaca e pergunte: 'O que é esse animal?'",
        },
      ],
    },
    {
      key: "corpo",
      title: "Partes do Corpo",
      emoji: "🧍",
      items: [
        {
          id: "b1",
          emoji: "👤",
          label: "Cabeça",
          instruction: "Aponte e pergunte: 'Onde fica a cabeça?'",
        },
        {
          id: "b2",
          emoji: "✋",
          label: "Mão",
          instruction: "Aponte e pergunte: 'Onde fica a mão?'",
        },
        {
          id: "b3",
          emoji: "🦶",
          label: "Pé",
          instruction: "Aponte e pergunte: 'Onde fica o pé?'",
        },
        {
          id: "b4",
          emoji: "👁️",
          label: "Olho",
          instruction: "Aponte e pergunte: 'Onde fica o olho?'",
        },
        {
          id: "b5",
          emoji: "👄",
          label: "Boca",
          instruction: "Aponte e pergunte: 'Onde fica a boca?'",
        },
      ],
    },
  ],
  "3-4": [
    {
      key: "cores",
      title: "Cores",
      emoji: "🎨",
      items: [
        {
          id: "c1",
          emoji: "🔴",
          label: "Vermelho",
          instruction: "Mostre algo vermelho e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c2",
          emoji: "🔵",
          label: "Azul",
          instruction: "Mostre algo azul e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c3",
          emoji: "🟡",
          label: "Amarelo",
          instruction: "Mostre algo amarelo e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c4",
          emoji: "🟢",
          label: "Verde",
          instruction: "Mostre algo verde e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c5",
          emoji: "🟣",
          label: "Roxo",
          instruction: "Mostre algo roxo e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c6",
          emoji: "🟠",
          label: "Laranja",
          instruction: "Mostre algo laranja e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c7",
          emoji: "⬛",
          label: "Preto",
          instruction: "Mostre algo preto e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c8",
          emoji: "⬜",
          label: "Branco",
          instruction: "Mostre algo branco e pergunte: 'Que cor é essa?'",
        },
      ],
    },
    {
      key: "letras",
      title: "Letras",
      emoji: "🔤",
      items: [
        {
          id: "l1",
          emoji: "🅰️",
          label: "Letra A",
          instruction: "Mostre a letra A maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l2",
          emoji: "🅱️",
          label: "Letra B",
          instruction: "Mostre a letra B maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l3",
          emoji: "🔡",
          label: "Letra C",
          instruction: "Mostre a letra C maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l4",
          emoji: "🔡",
          label: "Letra D",
          instruction: "Mostre a letra D maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l5",
          emoji: "📧",
          label: "Letra E",
          instruction: "Mostre a letra E maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l6",
          emoji: "Ⓜ️",
          label: "Letra M",
          instruction: "Mostre a letra M maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l7",
          emoji: "🅿️",
          label: "Letra P",
          instruction: "Mostre a letra P maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l8",
          emoji: "⭕",
          label: "Letra O",
          instruction: "Mostre a letra O maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l9",
          emoji: "ℹ️",
          label: "Letra I",
          instruction: "Mostre a letra I maiúscula e pergunte: 'O que é isso?'",
        },
        {
          id: "l10",
          emoji: "🔡",
          label: "Letra U",
          instruction: "Mostre a letra U maiúscula e pergunte: 'O que é isso?'",
        },
      ],
    },
    {
      key: "animais",
      title: "Animais",
      emoji: "🐾",
      items: [
        {
          id: "a1",
          emoji: "🐱",
          label: "Gato",
          instruction:
            "Mostre a figura de um gato e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a2",
          emoji: "🐶",
          label: "Cachorro",
          instruction:
            "Mostre a figura de um cachorro e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a3",
          emoji: "🐦",
          label: "Pássaro",
          instruction:
            "Mostre a figura de um pássaro e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a4",
          emoji: "🐟",
          label: "Peixe",
          instruction:
            "Mostre a figura de um peixe e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a5",
          emoji: "🐄",
          label: "Vaca",
          instruction:
            "Mostre a figura de uma vaca e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a6",
          emoji: "🐴",
          label: "Cavalo",
          instruction:
            "Mostre a figura de um cavalo e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a7",
          emoji: "🐔",
          label: "Galinha",
          instruction:
            "Mostre a figura de uma galinha e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a8",
          emoji: "🐷",
          label: "Porco",
          instruction:
            "Mostre a figura de um porco e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a9",
          emoji: "🐰",
          label: "Coelho",
          instruction:
            "Mostre a figura de um coelho e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a10",
          emoji: "🦋",
          label: "Borboleta",
          instruction:
            "Mostre a figura de uma borboleta e pergunte: 'O que é esse animal?'",
        },
      ],
    },
    {
      key: "corpo",
      title: "Partes do Corpo",
      emoji: "🧍",
      items: [
        {
          id: "b1",
          emoji: "👤",
          label: "Cabeça",
          instruction: "Aponte e pergunte: 'Onde fica a cabeça?'",
        },
        {
          id: "b2",
          emoji: "✋",
          label: "Mão",
          instruction: "Aponte e pergunte: 'Onde fica a mão?'",
        },
        {
          id: "b3",
          emoji: "🦶",
          label: "Pé",
          instruction: "Aponte e pergunte: 'Onde fica o pé?'",
        },
        {
          id: "b4",
          emoji: "👁️",
          label: "Olho",
          instruction: "Aponte e pergunte: 'Onde fica o olho?'",
        },
        {
          id: "b5",
          emoji: "👄",
          label: "Boca",
          instruction: "Aponte e pergunte: 'Onde fica a boca?'",
        },
        {
          id: "b6",
          emoji: "👃",
          label: "Nariz",
          instruction: "Aponte e pergunte: 'Onde fica o nariz?'",
        },
        {
          id: "b7",
          emoji: "👂",
          label: "Orelha",
          instruction: "Aponte e pergunte: 'Onde fica a orelha?'",
        },
        {
          id: "b8",
          emoji: "💇",
          label: "Cabelo",
          instruction: "Aponte e pergunte: 'Onde fica o cabelo?'",
        },
        {
          id: "b9",
          emoji: "🫃",
          label: "Barriga",
          instruction: "Aponte e pergunte: 'Onde fica a barriga?'",
        },
        {
          id: "b10",
          emoji: "💪",
          label: "Braço",
          instruction: "Aponte e pergunte: 'Onde fica o braço?'",
        },
      ],
    },
  ],
  "4-5": [
    {
      key: "cores",
      title: "Cores",
      emoji: "🎨",
      items: [
        {
          id: "c1",
          emoji: "🔴",
          label: "Vermelho",
          instruction: "Mostre algo vermelho e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c2",
          emoji: "🔵",
          label: "Azul",
          instruction: "Mostre algo azul e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c3",
          emoji: "🟡",
          label: "Amarelo",
          instruction: "Mostre algo amarelo e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c4",
          emoji: "🟢",
          label: "Verde",
          instruction: "Mostre algo verde e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c5",
          emoji: "🟣",
          label: "Roxo",
          instruction: "Mostre algo roxo e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c6",
          emoji: "🟠",
          label: "Laranja",
          instruction: "Mostre algo laranja e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c7",
          emoji: "⬛",
          label: "Preto",
          instruction: "Mostre algo preto e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c8",
          emoji: "⬜",
          label: "Branco",
          instruction: "Mostre algo branco e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c9",
          emoji: "🩷",
          label: "Rosa",
          instruction: "Mostre algo rosa e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c10",
          emoji: "🤎",
          label: "Marrom",
          instruction: "Mostre algo marrom e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c11",
          emoji: "🩶",
          label: "Cinza",
          instruction: "Mostre algo cinza e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c12",
          emoji: "🌟",
          label: "Dourado",
          instruction:
            "Mostre algo dourado/amarelo-ouro e pergunte: 'Que cor é essa?'",
        },
      ],
    },
    {
      key: "letras",
      title: "Letras",
      emoji: "🔤",
      items: [
        {
          id: "l1",
          emoji: "🔡",
          label: "20 letras maiúsculas (A-T)",
          instruction:
            "Mostre cada uma das 20 letras do alfabeto (A a T) e pergunte: 'O que é essa letra?'",
        },
        {
          id: "l2",
          emoji: "🅰️",
          label: "Som da vogal A",
          instruction: "Mostre a letra A e pergunte: 'Que som essa letra faz?'",
        },
        {
          id: "l3",
          emoji: "📧",
          label: "Som da vogal E",
          instruction: "Mostre a letra E e pergunte: 'Que som essa letra faz?'",
        },
        {
          id: "l4",
          emoji: "ℹ️",
          label: "Som da vogal I",
          instruction: "Mostre a letra I e pergunte: 'Que som essa letra faz?'",
        },
        {
          id: "l5",
          emoji: "⭕",
          label: "Som da vogal O",
          instruction: "Mostre a letra O e pergunte: 'Que som essa letra faz?'",
        },
        {
          id: "l6",
          emoji: "🔡",
          label: "Som da vogal U",
          instruction: "Mostre a letra U e pergunte: 'Que som essa letra faz?'",
        },
        {
          id: "l7",
          emoji: "🔡",
          label: "Letras U–Z restantes",
          instruction:
            "Mostre as letras U, V, W, X, Y, Z e pergunte: 'O que é essa letra?'",
        },
        {
          id: "l8",
          emoji: "🔡",
          label: "Diferencia vogais e consoantes",
          instruction:
            "Separe vogais e consoantes e pergunte: 'Essa é uma vogal ou uma consoante?'",
        },
        {
          id: "l9",
          emoji: "🔤",
          label: "Sequência alfabética parcial (A–E)",
          instruction: "Peça à criança para ordenar as letras A, B, C, D, E",
        },
        {
          id: "l10",
          emoji: "✏️",
          label: "Copia letras simples (I, O, A)",
          instruction: "Peça à criança para copiar as letras I, O e A",
        },
        {
          id: "l11",
          emoji: "🅱️",
          label: "Som de consoante B",
          instruction: "Mostre a letra B e pergunte: 'Que som essa letra faz?'",
        },
        {
          id: "l12",
          emoji: "🅿️",
          label: "Som de consoante P",
          instruction: "Mostre a letra P e pergunte: 'Que som essa letra faz?'",
        },
        {
          id: "l13",
          emoji: "Ⓜ️",
          label: "Som de consoante M",
          instruction: "Mostre a letra M e pergunte: 'Que som essa letra faz?'",
        },
        {
          id: "l14",
          emoji: "🔡",
          label: "Som de consoante S",
          instruction: "Mostre a letra S e pergunte: 'Que som essa letra faz?'",
        },
        {
          id: "l15",
          emoji: "🔡",
          label: "Som de consoante N",
          instruction: "Mostre a letra N e pergunte: 'Que som essa letra faz?'",
        },
      ],
    },
    {
      key: "animais",
      title: "Animais",
      emoji: "🐾",
      items: [
        {
          id: "a1",
          emoji: "🐱",
          label: "Gato",
          instruction: "Mostre a figura e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a2",
          emoji: "🐶",
          label: "Cachorro",
          instruction: "Mostre a figura e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a3",
          emoji: "🐦",
          label: "Pássaro",
          instruction: "Mostre a figura e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a4",
          emoji: "🐟",
          label: "Peixe",
          instruction: "Mostre a figura e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a5",
          emoji: "🐄",
          label: "Vaca",
          instruction: "Mostre a figura e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a6",
          emoji: "🐴",
          label: "Cavalo",
          instruction: "Mostre a figura e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a7",
          emoji: "🐔",
          label: "Galinha",
          instruction: "Mostre a figura e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a8",
          emoji: "🐷",
          label: "Porco",
          instruction: "Mostre a figura e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a9",
          emoji: "🐰",
          label: "Coelho",
          instruction: "Mostre a figura e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a10",
          emoji: "🦋",
          label: "Borboleta",
          instruction: "Mostre a figura e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a11",
          emoji: "🦁",
          label: "Leão",
          instruction:
            "Mostre a figura de um leão e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a12",
          emoji: "🐘",
          label: "Elefante",
          instruction:
            "Mostre a figura de um elefante e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a13",
          emoji: "🐒",
          label: "Macaco",
          instruction:
            "Mostre a figura de um macaco e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a14",
          emoji: "🐊",
          label: "Jacaré",
          instruction:
            "Mostre a figura de um jacaré e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a15",
          emoji: "🐢",
          label: "Tartaruga",
          instruction:
            "Mostre a figura de uma tartaruga e pergunte: 'O que é esse animal?'",
        },
      ],
    },
    {
      key: "corpo",
      title: "Partes do Corpo",
      emoji: "🧍",
      items: [
        {
          id: "b1",
          emoji: "👤",
          label: "Cabeça",
          instruction: "Aponte e pergunte: 'Onde fica a cabeça?'",
        },
        {
          id: "b2",
          emoji: "✋",
          label: "Mão",
          instruction: "Aponte e pergunte: 'Onde fica a mão?'",
        },
        {
          id: "b3",
          emoji: "🦶",
          label: "Pé",
          instruction: "Aponte e pergunte: 'Onde fica o pé?'",
        },
        {
          id: "b4",
          emoji: "👁️",
          label: "Olho",
          instruction: "Aponte e pergunte: 'Onde fica o olho?'",
        },
        {
          id: "b5",
          emoji: "👄",
          label: "Boca",
          instruction: "Aponte e pergunte: 'Onde fica a boca?'",
        },
        {
          id: "b6",
          emoji: "👃",
          label: "Nariz",
          instruction: "Aponte e pergunte: 'Onde fica o nariz?'",
        },
        {
          id: "b7",
          emoji: "👂",
          label: "Orelha",
          instruction: "Aponte e pergunte: 'Onde fica a orelha?'",
        },
        {
          id: "b8",
          emoji: "💇",
          label: "Cabelo",
          instruction: "Aponte e pergunte: 'Onde fica o cabelo?'",
        },
        {
          id: "b9",
          emoji: "🫃",
          label: "Barriga",
          instruction: "Aponte e pergunte: 'Onde fica a barriga?'",
        },
        {
          id: "b10",
          emoji: "💪",
          label: "Braço",
          instruction: "Aponte e pergunte: 'Onde fica o braço?'",
        },
        {
          id: "b11",
          emoji: "☝️",
          label: "Dedo",
          instruction: "Aponte e pergunte: 'Onde fica o dedo?'",
        },
        {
          id: "b12",
          emoji: "🦵",
          label: "Joelho",
          instruction: "Aponte e pergunte: 'Onde fica o joelho?'",
        },
        {
          id: "b13",
          emoji: "🧣",
          label: "Pescoço",
          instruction: "Aponte e pergunte: 'Onde fica o pescoço?'",
        },
        {
          id: "b14",
          emoji: "🤷",
          label: "Ombro",
          instruction: "Aponte e pergunte: 'Onde fica o ombro?'",
        },
        {
          id: "b15",
          emoji: "🦾",
          label: "Cotovelo",
          instruction: "Aponte e pergunte: 'Onde fica o cotovelo?'",
        },
      ],
    },
  ],
  "5-6": [
    {
      key: "cores",
      title: "Cores",
      emoji: "🎨",
      items: [
        {
          id: "c1",
          emoji: "🔴",
          label: "Vermelho",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c2",
          emoji: "🔵",
          label: "Azul",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c3",
          emoji: "🟡",
          label: "Amarelo",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c4",
          emoji: "🟢",
          label: "Verde",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c5",
          emoji: "🟣",
          label: "Roxo",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c6",
          emoji: "🟠",
          label: "Laranja",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c7",
          emoji: "⬛",
          label: "Preto",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c8",
          emoji: "⬜",
          label: "Branco",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c9",
          emoji: "🩷",
          label: "Rosa",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c10",
          emoji: "🤎",
          label: "Marrom",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c11",
          emoji: "🩶",
          label: "Cinza",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c12",
          emoji: "🌟",
          label: "Dourado",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c13",
          emoji: "🍎",
          label: "Nomeia cor de objeto real",
          instruction:
            "Mostre um objeto do cotidiano (ex.: maçã, céu, grama) e pergunte: 'Que cor é esse objeto?'",
        },
      ],
    },
    {
      key: "letras",
      title: "Letras",
      emoji: "🔤",
      items: [
        {
          id: "l1",
          emoji: "🔡",
          label: "Todas as 26 letras maiúsculas",
          instruction:
            "Mostre o alfabeto completo em maiúsculas e peça para identificar cada uma",
        },
        {
          id: "l2",
          emoji: "🅰️",
          label: "Som de consoante B",
          instruction: "Pergunte: 'Que som faz a letra B?'",
        },
        {
          id: "l3",
          emoji: "🅿️",
          label: "Som de consoante P",
          instruction: "Pergunte: 'Que som faz a letra P?'",
        },
        {
          id: "l4",
          emoji: "Ⓜ️",
          label: "Som de consoante M",
          instruction: "Pergunte: 'Que som faz a letra M?'",
        },
        {
          id: "l5",
          emoji: "🔡",
          label: "Som de consoante S",
          instruction: "Pergunte: 'Que som faz a letra S?'",
        },
        {
          id: "l6",
          emoji: "🔡",
          label: "Som de consoante N",
          instruction: "Pergunte: 'Que som faz a letra N?'",
        },
        {
          id: "l7",
          emoji: "🔡",
          label: "Som de consoante T",
          instruction: "Pergunte: 'Que som faz a letra T?'",
        },
        {
          id: "l8",
          emoji: "🔡",
          label: "Som de consoante R",
          instruction: "Pergunte: 'Que som faz a letra R?'",
        },
        {
          id: "l9",
          emoji: "🔡",
          label: "Som de consoante L",
          instruction: "Pergunte: 'Que som faz a letra L?'",
        },
        {
          id: "l10",
          emoji: "🔡",
          label: "Som de consoante D",
          instruction: "Pergunte: 'Que som faz a letra D?'",
        },
        {
          id: "l11",
          emoji: "🔡",
          label: "Som de consoante F",
          instruction: "Pergunte: 'Que som faz a letra F?'",
        },
        {
          id: "l12",
          emoji: "📝",
          label: "Escreve seu próprio nome",
          instruction: "Peça para a criança escrever o próprio nome",
        },
        {
          id: "l13",
          emoji: "🔤",
          label: "Identifica vogais no alfabeto",
          instruction: "Mostre o alfabeto e pergunte: 'Quais são as vogais?'",
        },
        {
          id: "l14",
          emoji: "✏️",
          label: "Copia palavras simples (ex.: MA, PA)",
          instruction: "Peça para copiar as sílabas MA e PA",
        },
        {
          id: "l15",
          emoji: "📖",
          label: "Reconhece seu nome escrito",
          instruction:
            "Mostre o nome da criança escrito e pergunte: 'O que está escrito aí?'",
        },
        {
          id: "l16",
          emoji: "🅱️",
          label: "Sequência alfabética A-Z",
          instruction:
            "Peça para a criança recitar o alfabeto na ordem correta",
        },
      ],
    },
    {
      key: "animais",
      title: "Animais",
      emoji: "🐾",
      items: [
        {
          id: "a1",
          emoji: "🐱",
          label: "Gato",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a2",
          emoji: "🐶",
          label: "Cachorro",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a3",
          emoji: "🐦",
          label: "Pássaro",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a4",
          emoji: "🐟",
          label: "Peixe",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a5",
          emoji: "🐄",
          label: "Vaca",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a6",
          emoji: "🐴",
          label: "Cavalo",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a7",
          emoji: "🐔",
          label: "Galinha",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a8",
          emoji: "🐷",
          label: "Porco",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a9",
          emoji: "🐰",
          label: "Coelho",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a10",
          emoji: "🦋",
          label: "Borboleta",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a11",
          emoji: "🦁",
          label: "Leão",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a12",
          emoji: "🐘",
          label: "Elefante",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a13",
          emoji: "🐒",
          label: "Macaco",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a14",
          emoji: "🐊",
          label: "Jacaré",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a15",
          emoji: "🐢",
          label: "Tartaruga",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a16",
          emoji: "🏠🌿",
          label: "Classifica: doméstico vs selvagem",
          instruction:
            "Mostre figuras de vários animais e pergunte: 'Esse animal vive na casa das pessoas ou na floresta?'",
        },
      ],
    },
    {
      key: "corpo",
      title: "Partes do Corpo",
      emoji: "🧍",
      items: [
        {
          id: "b1",
          emoji: "👤",
          label: "Cabeça",
          instruction: "Aponte e pergunte: 'Onde fica a cabeça?'",
        },
        {
          id: "b2",
          emoji: "✋",
          label: "Mão",
          instruction: "Aponte e pergunte: 'Onde fica a mão?'",
        },
        {
          id: "b3",
          emoji: "🦶",
          label: "Pé",
          instruction: "Aponte e pergunte: 'Onde fica o pé?'",
        },
        {
          id: "b4",
          emoji: "👁️",
          label: "Olho",
          instruction: "Aponte e pergunte: 'Onde fica o olho?'",
        },
        {
          id: "b5",
          emoji: "👄",
          label: "Boca",
          instruction: "Aponte e pergunte: 'Onde fica a boca?'",
        },
        {
          id: "b6",
          emoji: "👃",
          label: "Nariz",
          instruction: "Aponte e pergunte: 'Onde fica o nariz?'",
        },
        {
          id: "b7",
          emoji: "👂",
          label: "Orelha",
          instruction: "Aponte e pergunte: 'Onde fica a orelha?'",
        },
        {
          id: "b8",
          emoji: "💇",
          label: "Cabelo",
          instruction: "Aponte e pergunte: 'Onde fica o cabelo?'",
        },
        {
          id: "b9",
          emoji: "🫃",
          label: "Barriga",
          instruction: "Aponte e pergunte: 'Onde fica a barriga?'",
        },
        {
          id: "b10",
          emoji: "💪",
          label: "Braço",
          instruction: "Aponte e pergunte: 'Onde fica o braço?'",
        },
        {
          id: "b11",
          emoji: "☝️",
          label: "Dedo",
          instruction: "Aponte e pergunte: 'Onde fica o dedo?'",
        },
        {
          id: "b12",
          emoji: "🦵",
          label: "Joelho",
          instruction: "Aponte e pergunte: 'Onde fica o joelho?'",
        },
        {
          id: "b13",
          emoji: "🧣",
          label: "Pescoço",
          instruction: "Aponte e pergunte: 'Onde fica o pescoço?'",
        },
        {
          id: "b14",
          emoji: "🤷",
          label: "Ombro",
          instruction: "Aponte e pergunte: 'Onde fica o ombro?'",
        },
        {
          id: "b15",
          emoji: "🦾",
          label: "Cotovelo",
          instruction: "Aponte e pergunte: 'Onde fica o cotovelo?'",
        },
        {
          id: "b16",
          emoji: "👃❓",
          label: "Função do nariz",
          instruction: "Pergunte: 'Para que serve o nariz?'",
        },
        {
          id: "b17",
          emoji: "👁️❓",
          label: "Função do olho",
          instruction: "Pergunte: 'Para que servem os olhos?'",
        },
        {
          id: "b18",
          emoji: "👂❓",
          label: "Função da orelha/ouvido",
          instruction: "Pergunte: 'Para que serve a orelha/ouvido?'",
        },
      ],
    },
  ],
  "6-7": [
    {
      key: "cores",
      title: "Cores",
      emoji: "🎨",
      items: [
        {
          id: "c1",
          emoji: "🔴",
          label: "Vermelho",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c2",
          emoji: "🔵",
          label: "Azul",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c3",
          emoji: "🟡",
          label: "Amarelo",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c4",
          emoji: "🟢",
          label: "Verde",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c5",
          emoji: "🟣",
          label: "Roxo",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c6",
          emoji: "🟠",
          label: "Laranja",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c7",
          emoji: "⬛",
          label: "Preto",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c8",
          emoji: "⬜",
          label: "Branco",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c9",
          emoji: "🩷",
          label: "Rosa",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c10",
          emoji: "🤎",
          label: "Marrom",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c11",
          emoji: "🩶",
          label: "Cinza",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c12",
          emoji: "🌟",
          label: "Dourado",
          instruction: "Mostre e pergunte: 'Que cor é essa?'",
        },
        {
          id: "c13",
          emoji: "🍎",
          label: "Nomeia cor de objeto real",
          instruction:
            "Mostre objetos do cotidiano e pergunte: 'Que cor é esse objeto?'",
        },
        {
          id: "c14",
          emoji: "🎨🔬",
          label: "Mistura de cores (azul+amarelo=?)",
          instruction:
            "Pergunte: 'Se a gente misturar azul com amarelo, que cor vai fazer?'",
        },
      ],
    },
    {
      key: "letras",
      title: "Letras",
      emoji: "🔤",
      items: [
        {
          id: "l1",
          emoji: "🔡",
          label: "Todas as 26 letras maiúsculas",
          instruction:
            "Mostre o alfabeto em maiúsculas e peça para identificar cada letra",
        },
        {
          id: "l2",
          emoji: "🔡",
          label: "Todas as 26 letras minúsculas",
          instruction:
            "Mostre o alfabeto em minúsculas e peça para identificar cada letra",
        },
        {
          id: "l3",
          emoji: "🔤",
          label: "Sílaba MA",
          instruction:
            "Mostre o cartão com 'MA' e pergunte: 'O que está escrito?'",
        },
        {
          id: "l4",
          emoji: "🔤",
          label: "Sílaba PA",
          instruction:
            "Mostre o cartão com 'PA' e pergunte: 'O que está escrito?'",
        },
        {
          id: "l5",
          emoji: "🔤",
          label: "Sílaba BO",
          instruction:
            "Mostre o cartão com 'BO' e pergunte: 'O que está escrito?'",
        },
        {
          id: "l6",
          emoji: "🔤",
          label: "Sílaba MI",
          instruction:
            "Mostre o cartão com 'MI' e pergunte: 'O que está escrito?'",
        },
        {
          id: "l7",
          emoji: "🔤",
          label: "Sílaba TE",
          instruction:
            "Mostre o cartão com 'TE' e pergunte: 'O que está escrito?'",
        },
        {
          id: "l8",
          emoji: "📝",
          label: "Escreve o próprio nome completo",
          instruction: "Peça para a criança escrever o próprio nome",
        },
        {
          id: "l9",
          emoji: "🔤",
          label: "Lê palavras simples (bola, gato)",
          instruction:
            "Mostre as palavras 'bola' e 'gato' escritas e peça para ler",
        },
        {
          id: "l10",
          emoji: "🔡",
          label: "Corresponde maiúscula–minúscula",
          instruction:
            "Mostre pares de letras e pergunte: 'Essa grande e essa pequena são a mesma letra?'",
        },
        {
          id: "l11",
          emoji: "📖",
          label: "Reconhece nome dos colegas/família",
          instruction:
            "Mostre nomes escritos de pessoas conhecidas da criança e pergunte: 'O que está escrito?'",
        },
        {
          id: "l12",
          emoji: "✏️",
          label: "Copia frase simples de 3 palavras",
          instruction: "Peça para copiar uma frase curta, ex.: 'O gato come'",
        },
        {
          id: "l13",
          emoji: "🅰️",
          label: "Sons de vogais (A, E, I, O, U)",
          instruction: "Pergunte: 'Que som faz cada uma dessas letras?'",
        },
        {
          id: "l14",
          emoji: "🔡",
          label: "Sons de 5 consoantes (B,P,M,S,T)",
          instruction: "Mostre B, P, M, S, T e pergunte o som de cada uma",
        },
        {
          id: "l15",
          emoji: "🔤",
          label: "Conta sílabas em palavras simples",
          instruction:
            "Fale uma palavra (ex.: 'ca-sa', 'ca-va-lo') e pergunte: 'Quantas partes tem essa palavra?'",
        },
        {
          id: "l16",
          emoji: "📚",
          label: "Conhece a função de um livro",
          instruction: "Mostre um livro e pergunte: 'Para que serve isso?'",
        },
        {
          id: "l17",
          emoji: "🔤",
          label: "Identifica inicial de palavras",
          instruction: "Pergunte: 'Com que letra começa BOLA? E MACACO?'",
        },
        {
          id: "l18",
          emoji: "🖊️",
          label: "Escreve 5 letras sem modelo",
          instruction: "Peça para escrever 5 letras de memória sem copiar",
        },
      ],
    },
    {
      key: "animais",
      title: "Animais",
      emoji: "🐾",
      items: [
        {
          id: "a1",
          emoji: "🐱",
          label: "Gato",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a2",
          emoji: "🐶",
          label: "Cachorro",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a3",
          emoji: "🐦",
          label: "Pássaro",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a4",
          emoji: "🐟",
          label: "Peixe",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a5",
          emoji: "🐄",
          label: "Vaca",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a6",
          emoji: "🐴",
          label: "Cavalo",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a7",
          emoji: "🐔",
          label: "Galinha",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a8",
          emoji: "🐷",
          label: "Porco",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a9",
          emoji: "🐰",
          label: "Coelho",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a10",
          emoji: "🦋",
          label: "Borboleta",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a11",
          emoji: "🦁",
          label: "Leão",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a12",
          emoji: "🐘",
          label: "Elefante",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a13",
          emoji: "🐒",
          label: "Macaco",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a14",
          emoji: "🐊",
          label: "Jacaré",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a15",
          emoji: "🐢",
          label: "Tartaruga",
          instruction: "Mostre e pergunte: 'O que é esse animal?'",
        },
        {
          id: "a16",
          emoji: "🏠🌿",
          label: "Classifica: doméstico vs selvagem",
          instruction:
            "Pergunte: 'Esse animal vive com as pessoas ou na natureza?'",
        },
        {
          id: "a17",
          emoji: "🏠❓",
          label: "Habitat (onde mora?)",
          instruction:
            "Mostre figuras de animais e pergunte: 'Onde esse animal mora/vive?'",
        },
        {
          id: "a18",
          emoji: "🍖❓",
          label: "Alimentação (o que come?)",
          instruction:
            "Mostre figuras de animais e pergunte: 'O que esse animal come?'",
        },
      ],
    },
    {
      key: "corpo",
      title: "Partes do Corpo",
      emoji: "🧍",
      items: [
        {
          id: "b1",
          emoji: "👤",
          label: "Cabeça",
          instruction: "Aponte e pergunte: 'Onde fica a cabeça?'",
        },
        {
          id: "b2",
          emoji: "✋",
          label: "Mão",
          instruction: "Aponte e pergunte: 'Onde fica a mão?'",
        },
        {
          id: "b3",
          emoji: "🦶",
          label: "Pé",
          instruction: "Aponte e pergunte: 'Onde fica o pé?'",
        },
        {
          id: "b4",
          emoji: "👁️",
          label: "Olho",
          instruction: "Aponte e pergunte: 'Onde fica o olho?'",
        },
        {
          id: "b5",
          emoji: "👄",
          label: "Boca",
          instruction: "Aponte e pergunte: 'Onde fica a boca?'",
        },
        {
          id: "b6",
          emoji: "👃",
          label: "Nariz",
          instruction: "Aponte e pergunte: 'Onde fica o nariz?'",
        },
        {
          id: "b7",
          emoji: "👂",
          label: "Orelha",
          instruction: "Aponte e pergunte: 'Onde fica a orelha?'",
        },
        {
          id: "b8",
          emoji: "💇",
          label: "Cabelo",
          instruction: "Aponte e pergunte: 'Onde fica o cabelo?'",
        },
        {
          id: "b9",
          emoji: "🫃",
          label: "Barriga",
          instruction: "Aponte e pergunte: 'Onde fica a barriga?'",
        },
        {
          id: "b10",
          emoji: "💪",
          label: "Braço",
          instruction: "Aponte e pergunte: 'Onde fica o braço?'",
        },
        {
          id: "b11",
          emoji: "☝️",
          label: "Dedo",
          instruction: "Aponte e pergunte: 'Onde fica o dedo?'",
        },
        {
          id: "b12",
          emoji: "🦵",
          label: "Joelho",
          instruction: "Aponte e pergunte: 'Onde fica o joelho?'",
        },
        {
          id: "b13",
          emoji: "🧣",
          label: "Pescoço",
          instruction: "Aponte e pergunte: 'Onde fica o pescoço?'",
        },
        {
          id: "b14",
          emoji: "🤷",
          label: "Ombro",
          instruction: "Aponte e pergunte: 'Onde fica o ombro?'",
        },
        {
          id: "b15",
          emoji: "🦾",
          label: "Cotovelo",
          instruction: "Aponte e pergunte: 'Onde fica o cotovelo?'",
        },
        {
          id: "b16",
          emoji: "👃❓",
          label: "Função do nariz",
          instruction: "Pergunte: 'Para que serve o nariz?'",
        },
        {
          id: "b17",
          emoji: "👁️❓",
          label: "Função do olho",
          instruction: "Pergunte: 'Para que servem os olhos?'",
        },
        {
          id: "b18",
          emoji: "👂❓",
          label: "Função da orelha",
          instruction: "Pergunte: 'Para que serve a orelha?'",
        },
        {
          id: "b19",
          emoji: "❤️🫁🧠",
          label: "Órgãos internos (coração, pulmão, cérebro)",
          instruction:
            "Pergunte: 'Você conhece o coração? E o pulmão? E o cérebro? Para que cada um serve?'",
        },
        {
          id: "b20",
          emoji: "👉👈",
          label: "Lateralidade (direita/esquerda)",
          instruction: "Peça: 'Me mostre a sua mão direita. Agora a esquerda.'",
        },
      ],
    },
  ],
};

// ─── Banco infantil 1–5 anos ────────────────────────────────────────────────
// Este banco é uma triagem observacional curta: a resposta pode ser olhar,
// alcançar, apontar, escolher, vocalizar ou nomear conforme a idade e o perfil.
type InfantAgeGroup = "1" | "2" | "3" | "4" | "5";
type InfantDomainKey = "frutas" | "transportes" | "corpo" | "gerais";

interface InfantDomainDef {
  key: InfantDomainKey;
  title: string;
  emoji: string;
  items: TestItem[];
}

const INFANT_DOMAIN_DEFS: Record<InfantAgeGroup, InfantDomainDef[]> = {
  "1": [
    {
      key: "frutas",
      title: "Frutas",
      emoji: "🍎",
      items: [
        {
          id: "f1",
          emoji: "🍌",
          label: "Banana",
          instruction:
            "Mostre banana e outra figura familiar. Convide: 'Mostre a banana'. Aceite olhar, alcançar ou apontar.",
        },
        {
          id: "f2",
          emoji: "🍎",
          label: "Maçã",
          instruction:
            "Mostre maçã e outra figura familiar. Convide: 'Onde está a maçã?' Aceite resposta não verbal.",
        },
        {
          id: "f3",
          emoji: "🍊",
          label: "Laranja",
          instruction:
            "Mostre laranja e outra fruta. Convide a escolher a laranja, sem exigir nomeação.",
        },
      ],
    },
    {
      key: "transportes",
      title: "Transportes",
      emoji: "🚗",
      items: [
        {
          id: "t1",
          emoji: "🚗",
          label: "Carro",
          instruction:
            "Mostre carro e outro objeto. Convide: 'Cadê o carro?' Aceite olhar, tocar ou apontar.",
        },
        {
          id: "t2",
          emoji: "🚌",
          label: "Ônibus",
          instruction:
            "Mostre ônibus e outro veículo. Convide a escolher o ônibus, sem exigir fala.",
        },
        {
          id: "t3",
          emoji: "🚲",
          label: "Bicicleta",
          instruction:
            "Mostre bicicleta e outro veículo. Observe se a criança reconhece a figura familiar.",
        },
      ],
    },
    {
      key: "corpo",
      title: "Partes do corpo",
      emoji: "🧍",
      items: [
        {
          id: "b1",
          emoji: "👁️",
          label: "Olho",
          instruction:
            "Peça: 'Mostre o olho'. Aceite apontar no próprio corpo, no cuidador ou em uma figura.",
        },
        {
          id: "b2",
          emoji: "✋",
          label: "Mão",
          instruction:
            "Peça: 'Mostre a mão'. Aceite apontar ou levantar a mão.",
        },
        {
          id: "b3",
          emoji: "👄",
          label: "Boca",
          instruction: "Peça: 'Onde está a boca?' Não exija nomeação verbal.",
        },
      ],
    },
    {
      key: "gerais",
      title: "Conhecimentos gerais",
      emoji: "🌟",
      items: [
        {
          id: "g1",
          emoji: "⚽",
          label: "Objeto de brincar",
          instruction:
            "Mostre bola e outro objeto. Observe escolha, interesse e reconhecimento funcional.",
        },
        {
          id: "g2",
          emoji: "🥄",
          label: "Objeto de comer",
          instruction:
            "Mostre colher e outro objeto. Convide a escolher o que usamos para comer.",
        },
        {
          id: "g3",
          emoji: "🐶",
          label: "Animal familiar",
          instruction:
            "Mostre cachorro e outra figura. Convide a identificar por olhar, gesto ou vocalização.",
        },
      ],
    },
  ],
  "2": [
    {
      key: "frutas",
      title: "Frutas",
      emoji: "🍎",
      items: [
        {
          id: "f1",
          emoji: "🍌",
          label: "Banana",
          instruction:
            "Mostre 3 figuras e pergunte: 'Qual é a banana?' Aceite apontar ou nomear.",
        },
        {
          id: "f2",
          emoji: "🍎",
          label: "Maçã",
          instruction: "Mostre 3 figuras e pergunte: 'Onde está a maçã?'",
        },
        {
          id: "f3",
          emoji: "🍊",
          label: "Laranja",
          instruction: "Mostre 3 figuras e pergunte: 'Mostre a laranja'.",
        },
      ],
    },
    {
      key: "transportes",
      title: "Transportes",
      emoji: "🚗",
      items: [
        {
          id: "t1",
          emoji: "🚗",
          label: "Carro",
          instruction:
            "Mostre 3 figuras e pergunte: 'Qual anda na rua e leva pessoas?'",
        },
        {
          id: "t2",
          emoji: "🚌",
          label: "Ônibus",
          instruction: "Mostre 3 figuras e pergunte: 'Onde está o ônibus?'",
        },
        {
          id: "t3",
          emoji: "🚲",
          label: "Bicicleta",
          instruction: "Mostre 3 figuras e pergunte: 'Mostre a bicicleta'.",
        },
      ],
    },
    {
      key: "corpo",
      title: "Partes do corpo",
      emoji: "🧍",
      items: [
        {
          id: "b1",
          emoji: "👁️",
          label: "Olho",
          instruction: "Peça: 'Mostre o olho'.",
        },
        {
          id: "b2",
          emoji: "✋",
          label: "Mão",
          instruction: "Peça: 'Mostre a mão'.",
        },
        {
          id: "b3",
          emoji: "👄",
          label: "Boca",
          instruction: "Peça: 'Mostre a boca'.",
        },
      ],
    },
    {
      key: "gerais",
      title: "Conhecimentos gerais",
      emoji: "🌟",
      items: [
        {
          id: "g1",
          emoji: "🥄",
          label: "Para que serve a colher?",
          instruction:
            "Mostre colher e outro objeto. Pergunte: 'Qual usamos para comer?'",
        },
        {
          id: "g2",
          emoji: "🐶",
          label: "Animal familiar",
          instruction:
            "Mostre cachorro e outra figura. Pergunte: 'Qual é o cachorro?'",
        },
        {
          id: "g3",
          emoji: "🧸",
          label: "Brinquedo",
          instruction:
            "Mostre ursinho e outro objeto. Pergunte: 'Qual é o brinquedo?'",
        },
      ],
    },
  ],
  "3": [
    {
      key: "frutas",
      title: "Frutas",
      emoji: "🍎",
      items: [
        {
          id: "f1",
          emoji: "🍌",
          label: "Nomeia banana",
          instruction: "Mostre a figura e pergunte: 'O que é isso?'",
        },
        {
          id: "f2",
          emoji: "🍎",
          label: "Nomeia maçã",
          instruction: "Mostre a figura e pergunte: 'Que fruta é essa?'",
        },
        {
          id: "f3",
          emoji: "🍊",
          label: "Diferencia fruta",
          instruction:
            "Mostre frutas e um objeto. Pergunte: 'Qual não é fruta?'",
        },
      ],
    },
    {
      key: "transportes",
      title: "Transportes",
      emoji: "🚗",
      items: [
        {
          id: "t1",
          emoji: "✈️",
          label: "Avião",
          instruction: "Mostre 3 figuras e pergunte: 'Qual voa no céu?'",
        },
        {
          id: "t2",
          emoji: "⛵",
          label: "Barco",
          instruction: "Mostre 3 figuras e pergunte: 'Qual anda na água?'",
        },
        {
          id: "t3",
          emoji: "🚲",
          label: "Bicicleta",
          instruction: "Mostre a figura e pergunte: 'O que é isso?'",
        },
      ],
    },
    {
      key: "corpo",
      title: "Partes do corpo",
      emoji: "🧍",
      items: [
        {
          id: "b1",
          emoji: "👃",
          label: "Nariz",
          instruction: "Peça: 'Mostre o nariz'.",
        },
        {
          id: "b2",
          emoji: "👂",
          label: "Orelha",
          instruction: "Peça: 'Mostre a orelha'.",
        },
        {
          id: "b3",
          emoji: "🦶",
          label: "Pé",
          instruction: "Peça: 'Mostre o pé'.",
        },
      ],
    },
    {
      key: "gerais",
      title: "Conhecimentos gerais",
      emoji: "🌟",
      items: [
        {
          id: "g1",
          emoji: "🔴",
          label: "Cor",
          instruction:
            "Mostre duas cores fortes e pergunte: 'Qual é vermelho?'",
        },
        {
          id: "g2",
          emoji: "🔺",
          label: "Forma",
          instruction:
            "Mostre círculo, quadrado e triângulo. Pergunte: 'Qual é o triângulo?'",
        },
        {
          id: "g3",
          emoji: "🍎",
          label: "Função",
          instruction:
            "Pergunte: 'O que fazemos com a maçã?' Aceite resposta funcional simples.",
        },
      ],
    },
  ],
  "4": [
    {
      key: "frutas",
      title: "Frutas",
      emoji: "🍎",
      items: [
        {
          id: "f1",
          emoji: "🍓",
          label: "Morango",
          instruction: "Mostre 4 figuras e pergunte: 'Qual é o morango?'",
        },
        {
          id: "f2",
          emoji: "🍉",
          label: "Melancia",
          instruction: "Mostre 4 figuras e pergunte: 'Que fruta é essa?'",
        },
        {
          id: "f3",
          emoji: "🍎❌",
          label: "Fruta ou não fruta",
          instruction:
            "Apresente frutas e um objeto. Peça para separar o que é fruta.",
        },
      ],
    },
    {
      key: "transportes",
      title: "Transportes",
      emoji: "🚗",
      items: [
        {
          id: "t1",
          emoji: "🚗",
          label: "Terra",
          instruction:
            "Classifique carro, barco e avião: 'Qual anda na terra?'",
        },
        {
          id: "t2",
          emoji: "⛵",
          label: "Água",
          instruction: "Classifique carro, barco e avião: 'Qual anda na água?'",
        },
        {
          id: "t3",
          emoji: "🪖",
          label: "Segurança",
          instruction:
            "Pergunte: 'O que usamos na cabeça para andar de bicicleta?'",
        },
      ],
    },
    {
      key: "corpo",
      title: "Partes do corpo",
      emoji: "🧍",
      items: [
        {
          id: "b1",
          emoji: "👁️",
          label: "Ver",
          instruction:
            "Pergunte: 'Para que servem os olhos?' Aceite 'ver/enxergar'.",
        },
        {
          id: "b2",
          emoji: "👂",
          label: "Ouvir",
          instruction:
            "Pergunte: 'Para que serve a orelha?' Aceite 'ouvir/escutar'.",
        },
        {
          id: "b3",
          emoji: "✋",
          label: "Pegar",
          instruction:
            "Pergunte: 'Para que usamos as mãos?' Aceite função adequada.",
        },
      ],
    },
    {
      key: "gerais",
      title: "Conhecimentos gerais",
      emoji: "🌟",
      items: [
        {
          id: "g1",
          emoji: "🌞🌙",
          label: "Dia e noite",
          instruction:
            "Mostre sol e lua. Pergunte: 'Quando dormimos: de dia ou à noite?'",
        },
        {
          id: "g2",
          emoji: "🧼",
          label: "Higiene",
          instruction: "Pergunte: 'O que usamos para lavar as mãos?'",
        },
        {
          id: "g3",
          emoji: "1️⃣2️⃣3️⃣",
          label: "Quantidade pequena",
          instruction: "Peça para apontar 3 objetos em um grupo de até 5.",
        },
      ],
    },
  ],
  "5": [
    {
      key: "frutas",
      title: "Frutas",
      emoji: "🍎",
      items: [
        {
          id: "f1",
          emoji: "🍍",
          label: "Abacaxi",
          instruction: "Mostre 4 figuras e pergunte: 'Qual é o abacaxi?'",
        },
        {
          id: "f2",
          emoji: "🍇",
          label: "Uva",
          instruction:
            "Pergunte: 'Que fruta é essa?' e aceite nomeação ou descrição funcional.",
        },
        {
          id: "f3",
          emoji: "🍎🧺",
          label: "Classificação",
          instruction:
            "Peça para separar frutas de objetos e explicar uma escolha simples.",
        },
      ],
    },
    {
      key: "transportes",
      title: "Transportes",
      emoji: "🚗",
      items: [
        {
          id: "t1",
          emoji: "✈️",
          label: "Ar",
          instruction:
            "Relacione avião ao lugar onde se desloca: terra, água ou ar.",
        },
        {
          id: "t2",
          emoji: "🚦",
          label: "Regra de segurança",
          instruction:
            "Pergunte o que devemos fazer antes de atravessar a rua. Aceite resposta segura.",
        },
        {
          id: "t3",
          emoji: "🚌",
          label: "Uso do transporte",
          instruction:
            "Pergunte por que usamos ônibus/carro. Aceite finalidade coerente.",
        },
      ],
    },
    {
      key: "corpo",
      title: "Partes do corpo",
      emoji: "🧍",
      items: [
        {
          id: "b1",
          emoji: "❤️",
          label: "Coração",
          instruction:
            "Pergunte: 'Você conhece o coração? O que ele faz?' Aceite noção funcional simples.",
        },
        {
          id: "b2",
          emoji: "🦵",
          label: "Joelho",
          instruction:
            "Peça para apontar o joelho e mostrar como ele ajuda a dobrar a perna.",
        },
        {
          id: "b3",
          emoji: "👉👈",
          label: "Direita e esquerda",
          instruction:
            "Peça mão direita e depois esquerda; registre apenas como observação, sem conclusão isolada.",
        },
      ],
    },
    {
      key: "gerais",
      title: "Conhecimentos gerais",
      emoji: "🌟",
      items: [
        {
          id: "g1",
          emoji: "🔢",
          label: "Números 1–5",
          instruction:
            "Aponte números de 1 a 5 e peça para nomear alguns, sem exigir todos.",
        },
        {
          id: "g2",
          emoji: "🐱🐶",
          label: "Rima simples",
          instruction:
            "Pergunte qual palavra combina com 'gato' entre duas opções lúdicas.",
        },
        {
          id: "g3",
          emoji: "🌞➡️🌙",
          label: "Sequência temporal",
          instruction:
            "Peça para ordenar duas ou três cenas simples: acordar, brincar, dormir.",
        },
      ],
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function progressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 60) return "bg-amber-500";
  if (pct >= 40) return "bg-orange-500";
  return "bg-red-500";
}

const AGE_GROUPS: { value: AgeGroup; label: string; emoji: string }[] = [
  { value: "2-3", label: "2–3 anos", emoji: "👶" },
  { value: "3-4", label: "3–4 anos", emoji: "🧒" },
  { value: "4-5", label: "4–5 anos", emoji: "🧒" },
  { value: "5-6", label: "5–6 anos", emoji: "👦" },
  { value: "6-7", label: "6–7 anos", emoji: "👦" },
];

// ─── Score Button ─────────────────────────────────────────────────────────────

interface ScoreBtnProps {
  value: Score | null;
  onChange: (v: Score) => void;
}

function ScoreButtons({ value, onChange }: ScoreBtnProps) {
  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => onChange(2)}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
          value === 2
            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900"
            : "bg-background border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-600"
        }`}
      >
        ✅ <span className="hidden sm:inline">Acertou</span>
        <span className="font-bold">2</span>
      </button>
      <button
        onClick={() => onChange(1)}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
          value === 1
            ? "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200 dark:shadow-amber-900"
            : "bg-background border-border text-muted-foreground hover:border-amber-400 hover:text-amber-600"
        }`}
      >
        🔶 <span className="hidden sm:inline">Parcial</span>
        <span className="font-bold">1</span>
      </button>
      <button
        onClick={() => onChange(0)}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
          value === 0
            ? "bg-red-500 text-white border-red-500 shadow-sm shadow-red-200 dark:shadow-red-900"
            : "bg-background border-border text-muted-foreground hover:border-red-400 hover:text-red-600"
        }`}
      >
        ❌ <span className="hidden sm:inline">Não acertou</span>
        <span className="font-bold">0</span>
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function LegacyRecognitionPage() {
  // Step 1 state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);

  // Step 2 state — scores keyed by item id
  const [scores, setScores] = useState<Record<string, Score | null>>({});
  const [activeTab, setActiveTab] = useState<DomainKey>("cores");

  function setScore(id: string, val: Score) {
    setScores((prev) => ({ ...prev, [id]: val }));
  }

  const domains = ageGroup ? DOMAIN_DEFS[ageGroup] : [];

  // Calculate totals
  const results = useMemo(() => {
    if (!ageGroup) return null;
    const domData = DOMAIN_DEFS[ageGroup];

    const domainResults = domData.map((dom) => {
      const maxPossible = dom.items.length * 2;
      const earned = dom.items.reduce(
        (sum, item) => sum + (scores[item.id] ?? 0),
        0,
      );
      const pct =
        maxPossible > 0 ? Math.round((earned / maxPossible) * 100) : 0;
      return {
        key: dom.key,
        title: dom.title,
        emoji: dom.emoji,
        maxPossible,
        earned,
        pct,
        answered: dom.items.filter(
          (i) => scores[i.id] !== undefined && scores[i.id] !== null,
        ).length,
        total: dom.items.length,
      };
    });

    const totalMax = domainResults.reduce((s, d) => s + d.maxPossible, 0);
    const totalEarned = domainResults.reduce((s, d) => s + d.earned, 0);
    const totalPct =
      totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
    const totalAnswered = domainResults.reduce((s, d) => s + d.answered, 0);
    const totalItems = domainResults.reduce((s, d) => s + d.total, 0);

    return {
      domainResults,
      totalMax,
      totalEarned,
      totalPct,
      totalAnswered,
      totalItems,
    };
  }, [ageGroup, scores]);

  // Build ClinicalReport props
  const reportItems = useMemo(() => {
    if (!ageGroup) return [];
    return DOMAIN_DEFS[ageGroup].flatMap((dom) =>
      dom.items.map((item) => {
        const val = scores[item.id];
        const answer =
          val === undefined || val === null
            ? "Não respondida"
            : val === 2
              ? "Acertou"
              : val === 1
                ? "Parcial"
                : "Não acertou";
        return {
          question: `[${dom.title}] ${item.label} — ${item.instruction}`,
          answer,
        };
      }),
    );
  }, [ageGroup, scores]);

  function handleReset() {
    setStep(1);
    setChildName("");
    setChildAge("");
    setAgeGroup(null);
    setScores({});
    setActiveTab("cores");
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Testes de Reconhecimento
            </h1>
            <p className="text-xs text-muted-foreground">
              Avaliação interativa para crianças de 2 a 7 anos
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 p-4">
          <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
            <strong>Instruções:</strong> Estes testes são aplicados diretamente
            com a criança presente. O avaliador mostra cada item, realiza a
            pergunta indicada e registra se a criança reconheceu corretamente,
            parcialmente ou não reconheceu. Pontuação:{" "}
            <strong>✅ Acertou = 2 pts</strong> ·{" "}
            <strong>🔶 Parcial = 1 pt</strong> ·{" "}
            <strong>❌ Não acertou = 0 pts</strong>
          </p>
        </div>

        {/* Child info form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-violet-500" />
              Dados da Criança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="child-name" className="text-xs font-medium">
                  Nome da criança
                </Label>
                <Input
                  id="child-name"
                  placeholder="Nome completo"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="text-sm"
                  data-testid="input-child-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="child-age" className="text-xs font-medium">
                  Idade (anos/meses)
                </Label>
                <Input
                  id="child-age"
                  placeholder="Ex.: 3 anos e 4 meses"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className="text-sm"
                  data-testid="input-child-age"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age group selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-violet-500" />
              Selecione a Faixa Etária para o Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {AGE_GROUPS.map((ag) => (
                <button
                  key={ag.value}
                  onClick={() => setAgeGroup(ag.value)}
                  data-testid={`btn-age-${ag.value}`}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    ageGroup === ag.value
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-md"
                      : "border-border hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/10"
                  }`}
                >
                  <span className="text-3xl">{ag.emoji}</span>
                  <span className="text-xs font-semibold text-foreground">
                    {ag.label}
                  </span>
                  {ageGroup === ag.value && (
                    <CheckCircle2 className="w-4 h-4 text-violet-500" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => {
            if (ageGroup) setStep(2);
          }}
          disabled={!ageGroup}
          className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
          data-testid="btn-start-test"
        >
          Iniciar Avaliação
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // ── Step 2 — The actual test ───────────────────────────────────────────────

  if (step === 2 && ageGroup) {
    return (
      <div className="space-y-5 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">
                Testes de Reconhecimento
              </h1>
              {childName && (
                <p className="text-xs text-muted-foreground">
                  {childName}
                  {childAge ? ` · ${childAge}` : ""} ·{" "}
                  {AGE_GROUPS.find((a) => a.value === ageGroup)?.label}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(1)}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar
          </Button>
        </div>

        {/* Progress summary */}
        {results && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {results.domainResults.map((dom) => (
              <div
                key={dom.key}
                className="rounded-lg border border-border bg-card p-2.5"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">{dom.emoji}</span>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {dom.title}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  {dom.answered}/{dom.total} itens
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progressColor(dom.pct)}`}
                    style={{ width: `${dom.answered > 0 ? dom.pct : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs for domains */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as DomainKey)}
        >
          <TabsList className="w-full grid grid-cols-4">
            {domains.map((dom) => {
              const domResult = results?.domainResults.find(
                (d) => d.key === dom.key,
              );
              const allDone =
                domResult && domResult.answered === domResult.total;
              return (
                <TabsTrigger
                  key={dom.key}
                  value={dom.key}
                  className="text-xs gap-1"
                  data-testid={`tab-${dom.key}`}
                >
                  {dom.emoji}
                  <span className="hidden sm:inline">{dom.title}</span>
                  {allDone && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {domains.map((dom) => (
            <TabsContent
              key={dom.key}
              value={dom.key}
              className="space-y-3 mt-3"
            >
              {/* Domain header */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{dom.emoji}</span>
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    {dom.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {dom.items.length} itens
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2.5">
                {dom.items.map((item, idx) => {
                  const scored = scores[item.id];
                  return (
                    <Card
                      key={item.id}
                      className={`transition-all ${
                        scored === 2
                          ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/10"
                          : scored === 1
                            ? "border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/10"
                            : scored === 0
                              ? "border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/10"
                              : "border-border"
                      }`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Emoji + index */}
                          <div className="flex-shrink-0 flex flex-col items-center gap-1">
                            <span className="text-2xl leading-none">
                              {item.emoji}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">
                                  {item.label}
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                                  {item.instruction}
                                </p>
                              </div>
                              {/* Score indicator */}
                              {scored !== null && scored !== undefined && (
                                <Badge
                                  variant={
                                    scored === 2
                                      ? "default"
                                      : scored === 1
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className="flex-shrink-0 text-xs"
                                >
                                  {scored === 2
                                    ? "✅ 2"
                                    : scored === 1
                                      ? "🔶 1"
                                      : "❌ 0"}
                                </Badge>
                              )}
                            </div>

                            {/* Score buttons */}
                            <div className="mt-2.5">
                              <ScoreButtons
                                value={scored ?? null}
                                onChange={(v) => setScore(item.id, v)}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Next domain or see results */}
              <div className="flex gap-2 pt-1">
                {domains.findIndex((d) => d.key === dom.key) <
                domains.length - 1 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      const idx = domains.findIndex((d) => d.key === dom.key);
                      setActiveTab(domains[idx + 1].key);
                    }}
                  >
                    Próximo domínio <ChevronRight className="w-3 h-3" />
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  className="gap-1 bg-violet-600 hover:bg-violet-700 ml-auto"
                  onClick={() => setStep(3)}
                  disabled={!results || results.totalAnswered === 0}
                  data-testid="btn-view-results"
                >
                  Ver Resultados <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Floating total bar */}
        {results && results.totalAnswered > 0 && (
          <div className="sticky bottom-4 z-10">
            <div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-white/90 dark:bg-card/90 backdrop-blur-sm shadow-lg p-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">
                    Progresso total
                  </span>
                  <span className="font-bold text-foreground">
                    {results.totalAnswered}/{results.totalItems} itens ·{" "}
                    {results.totalEarned}/{results.totalMax} pts
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{
                      width: `${(results.totalAnswered / results.totalItems) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <Button
                size="sm"
                className="flex-shrink-0 bg-violet-600 hover:bg-violet-700 gap-1"
                onClick={() => setStep(3)}
              >
                Resultados <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Step 3 — Results ──────────────────────────────────────────────────────

  if (step === 3 && ageGroup && results) {
    const patientAge =
      childAge || AGE_GROUPS.find((item) => item.value === ageGroup)?.label;

    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <ClinicalReport
          scaleName="Testes de Reconhecimento para Menores"
          scaleFullName="Avaliação Interativa de Reconhecimento — Cores, Letras, Animais e Partes do Corpo"
          items={reportItems}
          patientAge={patientAge}
        />

        <SaveToPatient
          scaleName="Testes de Reconhecimento para Menores"
          responses={reportItems}
          patientAge={patientAge}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setStep(2)}
            data-testid="btn-edit-answers"
          >
            <ArrowLeft className="w-4 h-4" />
            Editar Respostas
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleReset}
            data-testid="btn-reset"
          >
            <RotateCcw className="w-4 h-4" />
            Nova Avaliação
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

void LegacyRecognitionPage;

// ─── Experiência infantil 1–5 anos ───────────────────────────────────────────
const INFANT_AGE_GROUPS: {
  value: InfantAgeGroup;
  label: string;
  emoji: string;
  note: string;
}[] = [
  {
    value: "1",
    label: "1 ano",
    emoji: "👶",
    note: "Olhar, alcançar e apontar",
  },
  {
    value: "2",
    label: "2 anos",
    emoji: "🧸",
    note: "Escolhas e reconhecimento",
  },
  { value: "3", label: "3 anos", emoji: "🧒", note: "Nomeação simples" },
  { value: "4", label: "4 anos", emoji: "🎨", note: "Classificação e função" },
  { value: "5", label: "5 anos", emoji: "🌟", note: "Relações e sequência" },
];

function InfantScoreButtons({ value, onChange }: ScoreBtnProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <button
        type="button"
        onClick={() => onChange(2)}
        className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition-all ${value === 2 ? "border-emerald-500 bg-emerald-500 text-white shadow-sm" : "border-border bg-background text-muted-foreground hover:border-emerald-400 hover:text-emerald-600"}`}
        aria-label="Acertou ou realizou de forma independente"
      >
        ✅ 2
        <span className="mt-0.5 block text-[9px] font-medium opacity-80">
          Fez sozinho
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange(1)}
        className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition-all ${value === 1 ? "border-amber-500 bg-amber-500 text-white shadow-sm" : "border-border bg-background text-muted-foreground hover:border-amber-400 hover:text-amber-600"}`}
        aria-label="Resposta parcial ou com ajuda"
      >
        🔶 1
        <span className="mt-0.5 block text-[9px] font-medium opacity-80">
          Com ajuda
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange(0)}
        className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition-all ${value === 0 ? "border-rose-500 bg-rose-500 text-white shadow-sm" : "border-border bg-background text-muted-foreground hover:border-rose-400 hover:text-rose-600"}`}
        aria-label="Não observado ou não realizou"
      >
        ❌ 0
        <span className="mt-0.5 block text-[9px] font-medium opacity-80">
          Não observado
        </span>
      </button>
    </div>
  );
}

export default function TestesReconhecimentoPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [ageGroup, setAgeGroup] = useState<InfantAgeGroup | null>(null);
  const [scores, setScores] = useState<Record<string, Score | null>>({});
  const [activeTab, setActiveTab] = useState<InfantDomainKey>("frutas");

  const domains = ageGroup ? INFANT_DOMAIN_DEFS[ageGroup] : [];
  const itemKey = (domain: InfantDomainKey, item: TestItem) =>
    `${domain}:${item.id}`;

  const results = useMemo(() => {
    if (!ageGroup) return null;
    const domainResults = INFANT_DOMAIN_DEFS[ageGroup].map((domain) => {
      const max = domain.items.length * 2;
      const earned = domain.items.reduce(
        (sum, item) => sum + (scores[itemKey(domain.key, item)] ?? 0),
        0,
      );
      const answered = domain.items.filter((item) => {
        const value = scores[itemKey(domain.key, item)];
        return value !== undefined && value !== null;
      }).length;
      return { ...domain, max, earned, answered };
    });
    const totalMax = domainResults.reduce((sum, domain) => sum + domain.max, 0);
    const totalEarned = domainResults.reduce(
      (sum, domain) => sum + domain.earned,
      0,
    );
    const totalAnswered = domainResults.reduce(
      (sum, domain) => sum + domain.answered,
      0,
    );
    return {
      domainResults,
      totalMax,
      totalEarned,
      totalAnswered,
      totalItems: totalMax / 2,
    };
  }, [ageGroup, scores]);

  const reportItems = useMemo(() => {
    if (!ageGroup) return [];
    return INFANT_DOMAIN_DEFS[ageGroup].flatMap((domain) =>
      domain.items.map((item) => {
        const value = scores[itemKey(domain.key, item)];
        const answer =
          value === undefined || value === null
            ? "Não observado"
            : value === 2
              ? "Realizou de forma independente"
              : value === 1
                ? "Realizou com ajuda / parcialmente"
                : "Não realizou / não observado";
        return {
          question: `[${domain.title}] ${item.label} — ${item.instruction}`,
          answer,
        };
      }),
    );
  }, [ageGroup, scores]);

  function resetInfantTest() {
    setStep(1);
    setChildName("");
    setChildAge("");
    setAgeGroup(null);
    setScores({});
    setActiveTab("frutas");
  }

  if (step === 1) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="relative overflow-hidden rounded-[2rem] border border-amber-200/70 bg-gradient-to-br from-amber-50 via-card to-rose-50 p-5 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:via-card dark:to-rose-950/20 sm:p-7">
          <div
            className="pointer-events-none absolute -right-10 -top-10 text-[8rem] opacity-20"
            aria-hidden="true"
          >
            🌈
          </div>
          <div className="relative flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 text-3xl shadow-lg">
              🧠
            </div>
            <div>
              <Badge className="mb-2 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-200">
                triagem lúdica · 1–5 anos
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Reconhecimento Visual Infantil
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Uma bateria curtinha para observar reconhecimento de frutas,
                transportes, partes do corpo e conhecimentos gerais por meio de
                imagens grandes e linguagem acolhedora.
              </p>
            </div>
          </div>
          <div className="relative mt-4 grid grid-cols-4 gap-2 text-center text-2xl sm:gap-3">
            <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-white/5">
              🍎
              <span className="mt-1 block text-[10px] font-bold text-muted-foreground">
                Frutas
              </span>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-white/5">
              🚗
              <span className="mt-1 block text-[10px] font-bold text-muted-foreground">
                Transportes
              </span>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-white/5">
              🧍
              <span className="mt-1 block text-[10px] font-bold text-muted-foreground">
                Corpo
              </span>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-white/5">
              🌟
              <span className="mt-1 block text-[10px] font-bold text-muted-foreground">
                Gerais
              </span>
            </div>
          </div>
        </header>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-amber-500" /> Dados da criança
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="infant-child-name"
                className="text-xs font-medium"
              >
                Nome (opcional)
              </Label>
              <Input
                id="infant-child-name"
                value={childName}
                onChange={(event) => setChildName(event.target.value)}
                placeholder="Nome ou iniciais"
                data-testid="infant-input-child-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="infant-child-age" className="text-xs font-medium">
                Idade / meses (opcional)
              </Label>
              <Input
                id="infant-child-age"
                value={childAge}
                onChange={(event) => setChildAge(event.target.value)}
                placeholder="Ex.: 2 anos e 6 meses"
                data-testid="infant-input-child-age"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-amber-500" /> Escolha a idade para
              graduar as tarefas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {INFANT_AGE_GROUPS.map((age) => (
              <button
                key={age.value}
                type="button"
                onClick={() => {
                  if (ageGroup === age.value) return;
                  setAgeGroup(age.value);
                  setScores({});
                  setActiveTab("frutas");
                }}
                data-testid={`infant-btn-age-${age.value}`}
                className={`rounded-2xl border-2 p-3 text-center transition-all ${ageGroup === age.value ? "border-amber-500 bg-amber-50 shadow-md dark:bg-amber-950/30" : "border-border bg-background hover:border-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/20"}`}
              >
                <span className="block text-3xl">{age.emoji}</span>
                <span className="mt-1 block text-xs font-bold text-foreground">
                  {age.label}
                </span>
                <span className="mt-1 block text-[9px] leading-tight text-muted-foreground">
                  {age.note}
                </span>
                {ageGroup === age.value && (
                  <CheckCircle2 className="mx-auto mt-2 h-4 w-4 text-amber-600" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
          <strong>Como aplicar:</strong> mostre a figura, faça a pergunta
          indicada e registre a melhor resposta da criança. Este é um recurso de
          triagem educativa e não substitui avaliação clínica do
          desenvolvimento. Para 1–2 anos, olhar, alcançar, tocar, apontar ou
          vocalizar podem ser respostas válidas conforme o item; não force
          nomeação verbal. Use “com ajuda” ou “não observado” quando a tarefa
          não for aplicável ao contexto.
        </div>
        <Button
          onClick={() => setStep(2)}
          disabled={!ageGroup}
          className="w-full gap-2 bg-amber-500 text-white hover:bg-amber-600"
          data-testid="infant-btn-start-test"
        >
          Começar a brincadeira <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (step === 2 && ageGroup && results) {
    const totalPct =
      results.totalItems > 0
        ? Math.round((results.totalEarned / results.totalMax) * 100)
        : 0;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-400 text-2xl shadow-sm">
              🌈
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Reconhecimento Visual Infantil
              </h1>
              <p className="text-xs text-muted-foreground">
                {childName || "Criança"}
                {childAge ? ` · ${childAge}` : ""} ·{" "}
                {
                  INFANT_AGE_GROUPS.find((item) => item.value === ageGroup)
                    ?.label
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(1)}
            className="gap-1 text-xs"
          >
            <ArrowLeft className="h-3 w-3" /> Voltar
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {results.domainResults.map((domain) => (
            <div
              key={domain.key}
              className="rounded-2xl border border-border bg-card p-3"
            >
              <div className="flex items-center gap-1.5 text-lg">
                <span>{domain.emoji}</span>
                <span className="truncate text-xs font-bold text-foreground">
                  {domain.title}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {domain.answered}/{domain.items.length} observados
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{
                    width: `${domain.answered ? Math.round((domain.earned / domain.max) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as InfantDomainKey)}
        >
          <TabsList className="grid w-full grid-cols-4">
            {domains.map((domain) => (
              <TabsTrigger
                key={domain.key}
                value={domain.key}
                className="gap-1 text-[11px]"
                data-testid={`infant-tab-${domain.key}`}
              >
                <span>{domain.emoji}</span>
                <span className="hidden sm:inline">{domain.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {domains.map((domain) => (
            <TabsContent
              key={domain.key}
              value={domain.key}
              className="mt-3 space-y-3"
            >
              <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-rose-50 p-4 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-rose-950/20">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{domain.emoji}</span>
                  <div>
                    <h2 className="font-bold text-foreground">
                      {domain.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {domain.items.length} tarefas curtas · observe sem pressa
                    </p>
                  </div>
                </div>
              </div>
              {domain.items.map((item, index) => {
                const key = itemKey(domain.key, item);
                const score = scores[key];
                return (
                  <Card
                    key={key}
                    className={`transition-all ${score === 2 ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/50 dark:bg-emerald-950/10" : score === 1 ? "border-amber-200 bg-amber-50/30 dark:border-amber-800/50 dark:bg-amber-950/10" : score === 0 ? "border-rose-200 bg-rose-50/30 dark:border-rose-800/50 dark:bg-rose-950/10" : "border-border"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-4xl dark:bg-amber-950/30">
                          {item.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {index + 1}. {item.label}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {item.instruction}
                              </p>
                            </div>
                            {score !== null && score !== undefined && (
                              <Badge
                                variant={
                                  score === 2
                                    ? "default"
                                    : score === 1
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {score === 2
                                  ? "✅ 2"
                                  : score === 1
                                    ? "🔶 1"
                                    : "❌ 0"}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-3">
                            <InfantScoreButtons
                              value={score ?? null}
                              onChange={(value) =>
                                setScores((previous) => ({
                                  ...previous,
                                  [key]: value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  className="gap-1 bg-amber-500 text-white hover:bg-amber-600"
                  onClick={() => setStep(3)}
                  disabled={results.totalAnswered === 0}
                  data-testid="infant-btn-view-results"
                >
                  Ver resultados ({results.totalAnswered}/{results.totalItems}){" "}
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <div className="sticky bottom-4 z-10">
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white/90 p-3 shadow-lg backdrop-blur dark:border-amber-900/40 dark:bg-card/90">
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  Progresso da brincadeira
                </span>
                <span className="font-bold text-foreground">
                  {results.totalAnswered}/{results.totalItems} itens ·{" "}
                  {totalPct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all"
                  style={{
                    width: `${(results.totalAnswered / results.totalItems) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3 && ageGroup && results) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-rose-50 p-5 text-center dark:border-amber-900/40 dark:from-amber-950/20 dark:to-rose-950/20">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-2 text-xl font-bold text-foreground">
            Observação registrada
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A bateria foi organizada por idade e os resultados ficam disponíveis
            no relatório abaixo.
          </p>
        </div>
        <ClinicalReport
          scaleName="Reconhecimento Visual Infantil"
          scaleFullName="Triagem lúdica de frutas, transportes, partes do corpo e conhecimentos gerais — 1–5 anos"
          items={reportItems}
          patientAge={
            childAge ||
            INFANT_AGE_GROUPS.find((item) => item.value === ageGroup)?.label
          }
        />
        <SaveToPatient
          scaleName="Reconhecimento Visual Infantil"
          responses={reportItems}
          patientAge={
            childAge ||
            INFANT_AGE_GROUPS.find((item) => item.value === ageGroup)?.label
          }
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setStep(2)}
          >
            <ArrowLeft className="h-4 w-4" /> Editar
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={resetInfantTest}
          >
            <RotateCcw className="h-4 w-4" /> Nova avaliação
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
