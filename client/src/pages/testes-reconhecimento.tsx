import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
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
        { id: "c1", emoji: "🔴", label: "Vermelho", instruction: "Mostre algo vermelho e pergunte: 'Que cor é essa?'" },
        { id: "c2", emoji: "🔵", label: "Azul", instruction: "Mostre algo azul e pergunte: 'Que cor é essa?'" },
        { id: "c3", emoji: "🟡", label: "Amarelo", instruction: "Mostre algo amarelo e pergunte: 'Que cor é essa?'" },
        { id: "c4", emoji: "🟢", label: "Verde", instruction: "Mostre algo verde e pergunte: 'Que cor é essa?'" },
      ],
    },
    {
      key: "letras",
      title: "Letras",
      emoji: "🔤",
      items: [
        { id: "l1", emoji: "🅰️", label: "Letra A", instruction: "Mostre a letra A maiúscula e pergunte: 'O que é isso?'" },
        { id: "l2", emoji: "⭕", label: "Letra O", instruction: "Mostre a letra O maiúscula e pergunte: 'O que é isso?'" },
        { id: "l3", emoji: "🅱️", label: "Letra B", instruction: "Mostre a letra B maiúscula e pergunte: 'O que é isso?'" },
        { id: "l4", emoji: "Ⓜ️", label: "Letra M", instruction: "Mostre a letra M maiúscula e pergunte: 'O que é isso?'" },
        { id: "l5", emoji: "🅿️", label: "Letra P", instruction: "Mostre a letra P maiúscula e pergunte: 'O que é isso?'" },
      ],
    },
    {
      key: "animais",
      title: "Animais",
      emoji: "🐾",
      items: [
        { id: "a1", emoji: "🐱", label: "Gato", instruction: "Mostre a figura de um gato e pergunte: 'O que é esse animal?'" },
        { id: "a2", emoji: "🐶", label: "Cachorro", instruction: "Mostre a figura de um cachorro e pergunte: 'O que é esse animal?'" },
        { id: "a3", emoji: "🐦", label: "Pássaro", instruction: "Mostre a figura de um pássaro e pergunte: 'O que é esse animal?'" },
        { id: "a4", emoji: "🐟", label: "Peixe", instruction: "Mostre a figura de um peixe e pergunte: 'O que é esse animal?'" },
        { id: "a5", emoji: "🐄", label: "Vaca", instruction: "Mostre a figura de uma vaca e pergunte: 'O que é esse animal?'" },
      ],
    },
    {
      key: "corpo",
      title: "Partes do Corpo",
      emoji: "🧍",
      items: [
        { id: "b1", emoji: "👤", label: "Cabeça", instruction: "Aponte e pergunte: 'Onde fica a cabeça?'" },
        { id: "b2", emoji: "✋", label: "Mão", instruction: "Aponte e pergunte: 'Onde fica a mão?'" },
        { id: "b3", emoji: "🦶", label: "Pé", instruction: "Aponte e pergunte: 'Onde fica o pé?'" },
        { id: "b4", emoji: "👁️", label: "Olho", instruction: "Aponte e pergunte: 'Onde fica o olho?'" },
        { id: "b5", emoji: "👄", label: "Boca", instruction: "Aponte e pergunte: 'Onde fica a boca?'" },
      ],
    },
  ],
  "3-4": [
    {
      key: "cores",
      title: "Cores",
      emoji: "🎨",
      items: [
        { id: "c1", emoji: "🔴", label: "Vermelho", instruction: "Mostre algo vermelho e pergunte: 'Que cor é essa?'" },
        { id: "c2", emoji: "🔵", label: "Azul", instruction: "Mostre algo azul e pergunte: 'Que cor é essa?'" },
        { id: "c3", emoji: "🟡", label: "Amarelo", instruction: "Mostre algo amarelo e pergunte: 'Que cor é essa?'" },
        { id: "c4", emoji: "🟢", label: "Verde", instruction: "Mostre algo verde e pergunte: 'Que cor é essa?'" },
        { id: "c5", emoji: "🟣", label: "Roxo", instruction: "Mostre algo roxo e pergunte: 'Que cor é essa?'" },
        { id: "c6", emoji: "🟠", label: "Laranja", instruction: "Mostre algo laranja e pergunte: 'Que cor é essa?'" },
        { id: "c7", emoji: "⬛", label: "Preto", instruction: "Mostre algo preto e pergunte: 'Que cor é essa?'" },
        { id: "c8", emoji: "⬜", label: "Branco", instruction: "Mostre algo branco e pergunte: 'Que cor é essa?'" },
      ],
    },
    {
      key: "letras",
      title: "Letras",
      emoji: "🔤",
      items: [
        { id: "l1", emoji: "🅰️", label: "Letra A", instruction: "Mostre a letra A maiúscula e pergunte: 'O que é isso?'" },
        { id: "l2", emoji: "🅱️", label: "Letra B", instruction: "Mostre a letra B maiúscula e pergunte: 'O que é isso?'" },
        { id: "l3", emoji: "🔡", label: "Letra C", instruction: "Mostre a letra C maiúscula e pergunte: 'O que é isso?'" },
        { id: "l4", emoji: "🔡", label: "Letra D", instruction: "Mostre a letra D maiúscula e pergunte: 'O que é isso?'" },
        { id: "l5", emoji: "📧", label: "Letra E", instruction: "Mostre a letra E maiúscula e pergunte: 'O que é isso?'" },
        { id: "l6", emoji: "Ⓜ️", label: "Letra M", instruction: "Mostre a letra M maiúscula e pergunte: 'O que é isso?'" },
        { id: "l7", emoji: "🅿️", label: "Letra P", instruction: "Mostre a letra P maiúscula e pergunte: 'O que é isso?'" },
        { id: "l8", emoji: "⭕", label: "Letra O", instruction: "Mostre a letra O maiúscula e pergunte: 'O que é isso?'" },
        { id: "l9", emoji: "ℹ️", label: "Letra I", instruction: "Mostre a letra I maiúscula e pergunte: 'O que é isso?'" },
        { id: "l10", emoji: "🔡", label: "Letra U", instruction: "Mostre a letra U maiúscula e pergunte: 'O que é isso?'" },
      ],
    },
    {
      key: "animais",
      title: "Animais",
      emoji: "🐾",
      items: [
        { id: "a1", emoji: "🐱", label: "Gato", instruction: "Mostre a figura de um gato e pergunte: 'O que é esse animal?'" },
        { id: "a2", emoji: "🐶", label: "Cachorro", instruction: "Mostre a figura de um cachorro e pergunte: 'O que é esse animal?'" },
        { id: "a3", emoji: "🐦", label: "Pássaro", instruction: "Mostre a figura de um pássaro e pergunte: 'O que é esse animal?'" },
        { id: "a4", emoji: "🐟", label: "Peixe", instruction: "Mostre a figura de um peixe e pergunte: 'O que é esse animal?'" },
        { id: "a5", emoji: "🐄", label: "Vaca", instruction: "Mostre a figura de uma vaca e pergunte: 'O que é esse animal?'" },
        { id: "a6", emoji: "🐴", label: "Cavalo", instruction: "Mostre a figura de um cavalo e pergunte: 'O que é esse animal?'" },
        { id: "a7", emoji: "🐔", label: "Galinha", instruction: "Mostre a figura de uma galinha e pergunte: 'O que é esse animal?'" },
        { id: "a8", emoji: "🐷", label: "Porco", instruction: "Mostre a figura de um porco e pergunte: 'O que é esse animal?'" },
        { id: "a9", emoji: "🐰", label: "Coelho", instruction: "Mostre a figura de um coelho e pergunte: 'O que é esse animal?'" },
        { id: "a10", emoji: "🦋", label: "Borboleta", instruction: "Mostre a figura de uma borboleta e pergunte: 'O que é esse animal?'" },
      ],
    },
    {
      key: "corpo",
      title: "Partes do Corpo",
      emoji: "🧍",
      items: [
        { id: "b1", emoji: "👤", label: "Cabeça", instruction: "Aponte e pergunte: 'Onde fica a cabeça?'" },
        { id: "b2", emoji: "✋", label: "Mão", instruction: "Aponte e pergunte: 'Onde fica a mão?'" },
        { id: "b3", emoji: "🦶", label: "Pé", instruction: "Aponte e pergunte: 'Onde fica o pé?'" },
        { id: "b4", emoji: "👁️", label: "Olho", instruction: "Aponte e pergunte: 'Onde fica o olho?'" },
        { id: "b5", emoji: "👄", label: "Boca", instruction: "Aponte e pergunte: 'Onde fica a boca?'" },
        { id: "b6", emoji: "👃", label: "Nariz", instruction: "Aponte e pergunte: 'Onde fica o nariz?'" },
        { id: "b7", emoji: "👂", label: "Orelha", instruction: "Aponte e pergunte: 'Onde fica a orelha?'" },
        { id: "b8", emoji: "💇", label: "Cabelo", instruction: "Aponte e pergunte: 'Onde fica o cabelo?'" },
        { id: "b9", emoji: "🫃", label: "Barriga", instruction: "Aponte e pergunte: 'Onde fica a barriga?'" },
        { id: "b10", emoji: "💪", label: "Braço", instruction: "Aponte e pergunte: 'Onde fica o braço?'" },
      ],
    },
  ],
  "4-5": [
    {
      key: "cores",
      title: "Cores",
      emoji: "🎨",
      items: [
        { id: "c1", emoji: "🔴", label: "Vermelho", instruction: "Mostre algo vermelho e pergunte: 'Que cor é essa?'" },
        { id: "c2", emoji: "🔵", label: "Azul", instruction: "Mostre algo azul e pergunte: 'Que cor é essa?'" },
        { id: "c3", emoji: "🟡", label: "Amarelo", instruction: "Mostre algo amarelo e pergunte: 'Que cor é essa?'" },
        { id: "c4", emoji: "🟢", label: "Verde", instruction: "Mostre algo verde e pergunte: 'Que cor é essa?'" },
        { id: "c5", emoji: "🟣", label: "Roxo", instruction: "Mostre algo roxo e pergunte: 'Que cor é essa?'" },
        { id: "c6", emoji: "🟠", label: "Laranja", instruction: "Mostre algo laranja e pergunte: 'Que cor é essa?'" },
        { id: "c7", emoji: "⬛", label: "Preto", instruction: "Mostre algo preto e pergunte: 'Que cor é essa?'" },
        { id: "c8", emoji: "⬜", label: "Branco", instruction: "Mostre algo branco e pergunte: 'Que cor é essa?'" },
        { id: "c9", emoji: "🩷", label: "Rosa", instruction: "Mostre algo rosa e pergunte: 'Que cor é essa?'" },
        { id: "c10", emoji: "🤎", label: "Marrom", instruction: "Mostre algo marrom e pergunte: 'Que cor é essa?'" },
        { id: "c11", emoji: "🩶", label: "Cinza", instruction: "Mostre algo cinza e pergunte: 'Que cor é essa?'" },
        { id: "c12", emoji: "🌟", label: "Dourado", instruction: "Mostre algo dourado/amarelo-ouro e pergunte: 'Que cor é essa?'" },
      ],
    },
    {
      key: "letras",
      title: "Letras",
      emoji: "🔤",
      items: [
        { id: "l1", emoji: "🔡", label: "20 letras maiúsculas (A-T)", instruction: "Mostre cada uma das 20 letras do alfabeto (A a T) e pergunte: 'O que é essa letra?'" },
        { id: "l2", emoji: "🅰️", label: "Som da vogal A", instruction: "Mostre a letra A e pergunte: 'Que som essa letra faz?'" },
        { id: "l3", emoji: "📧", label: "Som da vogal E", instruction: "Mostre a letra E e pergunte: 'Que som essa letra faz?'" },
        { id: "l4", emoji: "ℹ️", label: "Som da vogal I", instruction: "Mostre a letra I e pergunte: 'Que som essa letra faz?'" },
        { id: "l5", emoji: "⭕", label: "Som da vogal O", instruction: "Mostre a letra O e pergunte: 'Que som essa letra faz?'" },
        { id: "l6", emoji: "🔡", label: "Som da vogal U", instruction: "Mostre a letra U e pergunte: 'Que som essa letra faz?'" },
        { id: "l7", emoji: "🔡", label: "Letras U–Z restantes", instruction: "Mostre as letras U, V, W, X, Y, Z e pergunte: 'O que é essa letra?'" },
        { id: "l8", emoji: "🔡", label: "Diferencia vogais e consoantes", instruction: "Separe vogais e consoantes e pergunte: 'Essa é uma vogal ou uma consoante?'" },
        { id: "l9", emoji: "🔤", label: "Sequência alfabética parcial (A–E)", instruction: "Peça à criança para ordenar as letras A, B, C, D, E" },
        { id: "l10", emoji: "✏️", label: "Copia letras simples (I, O, A)", instruction: "Peça à criança para copiar as letras I, O e A" },
        { id: "l11", emoji: "🅱️", label: "Som de consoante B", instruction: "Mostre a letra B e pergunte: 'Que som essa letra faz?'" },
        { id: "l12", emoji: "🅿️", label: "Som de consoante P", instruction: "Mostre a letra P e pergunte: 'Que som essa letra faz?'" },
        { id: "l13", emoji: "Ⓜ️", label: "Som de consoante M", instruction: "Mostre a letra M e pergunte: 'Que som essa letra faz?'" },
        { id: "l14", emoji: "🔡", label: "Som de consoante S", instruction: "Mostre a letra S e pergunte: 'Que som essa letra faz?'" },
        { id: "l15", emoji: "🔡", label: "Som de consoante N", instruction: "Mostre a letra N e pergunte: 'Que som essa letra faz?'" },
      ],
    },
    {
      key: "animais",
      title: "Animais",
      emoji: "🐾",
      items: [
        { id: "a1", emoji: "🐱", label: "Gato", instruction: "Mostre a figura e pergunte: 'O que é esse animal?'" },
        { id: "a2", emoji: "🐶", label: "Cachorro", instruction: "Mostre a figura e pergunte: 'O que é esse animal?'" },
        { id: "a3", emoji: "🐦", label: "Pássaro", instruction: "Mostre a figura e pergunte: 'O que é esse animal?'" },
        { id: "a4", emoji: "🐟", label: "Peixe", instruction: "Mostre a figura e pergunte: 'O que é esse animal?'" },
        { id: "a5", emoji: "🐄", label: "Vaca", instruction: "Mostre a figura e pergunte: 'O que é esse animal?'" },
        { id: "a6", emoji: "🐴", label: "Cavalo", instruction: "Mostre a figura e pergunte: 'O que é esse animal?'" },
        { id: "a7", emoji: "🐔", label: "Galinha", instruction: "Mostre a figura e pergunte: 'O que é esse animal?'" },
        { id: "a8", emoji: "🐷", label: "Porco", instruction: "Mostre a figura e pergunte: 'O que é esse animal?'" },
        { id: "a9", emoji: "🐰", label: "Coelho", instruction: "Mostre a figura e pergunte: 'O que é esse animal?'" },
        { id: "a10", emoji: "🦋", label: "Borboleta", instruction: "Mostre a figura e pergunte: 'O que é esse animal?'" },
        { id: "a11", emoji: "🦁", label: "Leão", instruction: "Mostre a figura de um leão e pergunte: 'O que é esse animal?'" },
        { id: "a12", emoji: "🐘", label: "Elefante", instruction: "Mostre a figura de um elefante e pergunte: 'O que é esse animal?'" },
        { id: "a13", emoji: "🐒", label: "Macaco", instruction: "Mostre a figura de um macaco e pergunte: 'O que é esse animal?'" },
        { id: "a14", emoji: "🐊", label: "Jacaré", instruction: "Mostre a figura de um jacaré e pergunte: 'O que é esse animal?'" },
        { id: "a15", emoji: "🐢", label: "Tartaruga", instruction: "Mostre a figura de uma tartaruga e pergunte: 'O que é esse animal?'" },
      ],
    },
    {
      key: "corpo",
      title: "Partes do Corpo",
      emoji: "🧍",
      items: [
        { id: "b1", emoji: "👤", label: "Cabeça", instruction: "Aponte e pergunte: 'Onde fica a cabeça?'" },
        { id: "b2", emoji: "✋", label: "Mão", instruction: "Aponte e pergunte: 'Onde fica a mão?'" },
        { id: "b3", emoji: "🦶", label: "Pé", instruction: "Aponte e pergunte: 'Onde fica o pé?'" },
        { id: "b4", emoji: "👁️", label: "Olho", instruction: "Aponte e pergunte: 'Onde fica o olho?'" },
        { id: "b5", emoji: "👄", label: "Boca", instruction: "Aponte e pergunte: 'Onde fica a boca?'" },
        { id: "b6", emoji: "👃", label: "Nariz", instruction: "Aponte e pergunte: 'Onde fica o nariz?'" },
        { id: "b7", emoji: "👂", label: "Orelha", instruction: "Aponte e pergunte: 'Onde fica a orelha?'" },
        { id: "b8", emoji: "💇", label: "Cabelo", instruction: "Aponte e pergunte: 'Onde fica o cabelo?'" },
        { id: "b9", emoji: "🫃", label: "Barriga", instruction: "Aponte e pergunte: 'Onde fica a barriga?'" },
        { id: "b10", emoji: "💪", label: "Braço", instruction: "Aponte e pergunte: 'Onde fica o braço?'" },
        { id: "b11", emoji: "☝️", label: "Dedo", instruction: "Aponte e pergunte: 'Onde fica o dedo?'" },
        { id: "b12", emoji: "🦵", label: "Joelho", instruction: "Aponte e pergunte: 'Onde fica o joelho?'" },
        { id: "b13", emoji: "🧣", label: "Pescoço", instruction: "Aponte e pergunte: 'Onde fica o pescoço?'" },
        { id: "b14", emoji: "🤷", label: "Ombro", instruction: "Aponte e pergunte: 'Onde fica o ombro?'" },
        { id: "b15", emoji: "🦾", label: "Cotovelo", instruction: "Aponte e pergunte: 'Onde fica o cotovelo?'" },
      ],
    },
  ],
  "5-6": [
    {
      key: "cores",
      title: "Cores",
      emoji: "🎨",
      items: [
        { id: "c1", emoji: "🔴", label: "Vermelho", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c2", emoji: "🔵", label: "Azul", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c3", emoji: "🟡", label: "Amarelo", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c4", emoji: "🟢", label: "Verde", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c5", emoji: "🟣", label: "Roxo", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c6", emoji: "🟠", label: "Laranja", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c7", emoji: "⬛", label: "Preto", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c8", emoji: "⬜", label: "Branco", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c9", emoji: "🩷", label: "Rosa", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c10", emoji: "🤎", label: "Marrom", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c11", emoji: "🩶", label: "Cinza", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c12", emoji: "🌟", label: "Dourado", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c13", emoji: "🍎", label: "Nomeia cor de objeto real", instruction: "Mostre um objeto do cotidiano (ex.: maçã, céu, grama) e pergunte: 'Que cor é esse objeto?'" },
      ],
    },
    {
      key: "letras",
      title: "Letras",
      emoji: "🔤",
      items: [
        { id: "l1", emoji: "🔡", label: "Todas as 26 letras maiúsculas", instruction: "Mostre o alfabeto completo em maiúsculas e peça para identificar cada uma" },
        { id: "l2", emoji: "🅰️", label: "Som de consoante B", instruction: "Pergunte: 'Que som faz a letra B?'" },
        { id: "l3", emoji: "🅿️", label: "Som de consoante P", instruction: "Pergunte: 'Que som faz a letra P?'" },
        { id: "l4", emoji: "Ⓜ️", label: "Som de consoante M", instruction: "Pergunte: 'Que som faz a letra M?'" },
        { id: "l5", emoji: "🔡", label: "Som de consoante S", instruction: "Pergunte: 'Que som faz a letra S?'" },
        { id: "l6", emoji: "🔡", label: "Som de consoante N", instruction: "Pergunte: 'Que som faz a letra N?'" },
        { id: "l7", emoji: "🔡", label: "Som de consoante T", instruction: "Pergunte: 'Que som faz a letra T?'" },
        { id: "l8", emoji: "🔡", label: "Som de consoante R", instruction: "Pergunte: 'Que som faz a letra R?'" },
        { id: "l9", emoji: "🔡", label: "Som de consoante L", instruction: "Pergunte: 'Que som faz a letra L?'" },
        { id: "l10", emoji: "🔡", label: "Som de consoante D", instruction: "Pergunte: 'Que som faz a letra D?'" },
        { id: "l11", emoji: "🔡", label: "Som de consoante F", instruction: "Pergunte: 'Que som faz a letra F?'" },
        { id: "l12", emoji: "📝", label: "Escreve seu próprio nome", instruction: "Peça para a criança escrever o próprio nome" },
        { id: "l13", emoji: "🔤", label: "Identifica vogais no alfabeto", instruction: "Mostre o alfabeto e pergunte: 'Quais são as vogais?'" },
        { id: "l14", emoji: "✏️", label: "Copia palavras simples (ex.: MA, PA)", instruction: "Peça para copiar as sílabas MA e PA" },
        { id: "l15", emoji: "📖", label: "Reconhece seu nome escrito", instruction: "Mostre o nome da criança escrito e pergunte: 'O que está escrito aí?'" },
        { id: "l16", emoji: "🅱️", label: "Sequência alfabética A-Z", instruction: "Peça para a criança recitar o alfabeto na ordem correta" },
      ],
    },
    {
      key: "animais",
      title: "Animais",
      emoji: "🐾",
      items: [
        { id: "a1", emoji: "🐱", label: "Gato", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a2", emoji: "🐶", label: "Cachorro", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a3", emoji: "🐦", label: "Pássaro", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a4", emoji: "🐟", label: "Peixe", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a5", emoji: "🐄", label: "Vaca", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a6", emoji: "🐴", label: "Cavalo", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a7", emoji: "🐔", label: "Galinha", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a8", emoji: "🐷", label: "Porco", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a9", emoji: "🐰", label: "Coelho", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a10", emoji: "🦋", label: "Borboleta", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a11", emoji: "🦁", label: "Leão", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a12", emoji: "🐘", label: "Elefante", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a13", emoji: "🐒", label: "Macaco", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a14", emoji: "🐊", label: "Jacaré", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a15", emoji: "🐢", label: "Tartaruga", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a16", emoji: "🏠🌿", label: "Classifica: doméstico vs selvagem", instruction: "Mostre figuras de vários animais e pergunte: 'Esse animal vive na casa das pessoas ou na floresta?'" },
      ],
    },
    {
      key: "corpo",
      title: "Partes do Corpo",
      emoji: "🧍",
      items: [
        { id: "b1", emoji: "👤", label: "Cabeça", instruction: "Aponte e pergunte: 'Onde fica a cabeça?'" },
        { id: "b2", emoji: "✋", label: "Mão", instruction: "Aponte e pergunte: 'Onde fica a mão?'" },
        { id: "b3", emoji: "🦶", label: "Pé", instruction: "Aponte e pergunte: 'Onde fica o pé?'" },
        { id: "b4", emoji: "👁️", label: "Olho", instruction: "Aponte e pergunte: 'Onde fica o olho?'" },
        { id: "b5", emoji: "👄", label: "Boca", instruction: "Aponte e pergunte: 'Onde fica a boca?'" },
        { id: "b6", emoji: "👃", label: "Nariz", instruction: "Aponte e pergunte: 'Onde fica o nariz?'" },
        { id: "b7", emoji: "👂", label: "Orelha", instruction: "Aponte e pergunte: 'Onde fica a orelha?'" },
        { id: "b8", emoji: "💇", label: "Cabelo", instruction: "Aponte e pergunte: 'Onde fica o cabelo?'" },
        { id: "b9", emoji: "🫃", label: "Barriga", instruction: "Aponte e pergunte: 'Onde fica a barriga?'" },
        { id: "b10", emoji: "💪", label: "Braço", instruction: "Aponte e pergunte: 'Onde fica o braço?'" },
        { id: "b11", emoji: "☝️", label: "Dedo", instruction: "Aponte e pergunte: 'Onde fica o dedo?'" },
        { id: "b12", emoji: "🦵", label: "Joelho", instruction: "Aponte e pergunte: 'Onde fica o joelho?'" },
        { id: "b13", emoji: "🧣", label: "Pescoço", instruction: "Aponte e pergunte: 'Onde fica o pescoço?'" },
        { id: "b14", emoji: "🤷", label: "Ombro", instruction: "Aponte e pergunte: 'Onde fica o ombro?'" },
        { id: "b15", emoji: "🦾", label: "Cotovelo", instruction: "Aponte e pergunte: 'Onde fica o cotovelo?'" },
        { id: "b16", emoji: "👃❓", label: "Função do nariz", instruction: "Pergunte: 'Para que serve o nariz?'" },
        { id: "b17", emoji: "👁️❓", label: "Função do olho", instruction: "Pergunte: 'Para que servem os olhos?'" },
        { id: "b18", emoji: "👂❓", label: "Função da orelha/ouvido", instruction: "Pergunte: 'Para que serve a orelha/ouvido?'" },
      ],
    },
  ],
  "6-7": [
    {
      key: "cores",
      title: "Cores",
      emoji: "🎨",
      items: [
        { id: "c1", emoji: "🔴", label: "Vermelho", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c2", emoji: "🔵", label: "Azul", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c3", emoji: "🟡", label: "Amarelo", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c4", emoji: "🟢", label: "Verde", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c5", emoji: "🟣", label: "Roxo", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c6", emoji: "🟠", label: "Laranja", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c7", emoji: "⬛", label: "Preto", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c8", emoji: "⬜", label: "Branco", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c9", emoji: "🩷", label: "Rosa", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c10", emoji: "🤎", label: "Marrom", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c11", emoji: "🩶", label: "Cinza", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c12", emoji: "🌟", label: "Dourado", instruction: "Mostre e pergunte: 'Que cor é essa?'" },
        { id: "c13", emoji: "🍎", label: "Nomeia cor de objeto real", instruction: "Mostre objetos do cotidiano e pergunte: 'Que cor é esse objeto?'" },
        { id: "c14", emoji: "🎨🔬", label: "Mistura de cores (azul+amarelo=?)", instruction: "Pergunte: 'Se a gente misturar azul com amarelo, que cor vai fazer?'" },
      ],
    },
    {
      key: "letras",
      title: "Letras",
      emoji: "🔤",
      items: [
        { id: "l1", emoji: "🔡", label: "Todas as 26 letras maiúsculas", instruction: "Mostre o alfabeto em maiúsculas e peça para identificar cada letra" },
        { id: "l2", emoji: "🔡", label: "Todas as 26 letras minúsculas", instruction: "Mostre o alfabeto em minúsculas e peça para identificar cada letra" },
        { id: "l3", emoji: "🔤", label: "Sílaba MA", instruction: "Mostre o cartão com 'MA' e pergunte: 'O que está escrito?'" },
        { id: "l4", emoji: "🔤", label: "Sílaba PA", instruction: "Mostre o cartão com 'PA' e pergunte: 'O que está escrito?'" },
        { id: "l5", emoji: "🔤", label: "Sílaba BO", instruction: "Mostre o cartão com 'BO' e pergunte: 'O que está escrito?'" },
        { id: "l6", emoji: "🔤", label: "Sílaba MI", instruction: "Mostre o cartão com 'MI' e pergunte: 'O que está escrito?'" },
        { id: "l7", emoji: "🔤", label: "Sílaba TE", instruction: "Mostre o cartão com 'TE' e pergunte: 'O que está escrito?'" },
        { id: "l8", emoji: "📝", label: "Escreve o próprio nome completo", instruction: "Peça para a criança escrever o próprio nome" },
        { id: "l9", emoji: "🔤", label: "Lê palavras simples (bola, gato)", instruction: "Mostre as palavras 'bola' e 'gato' escritas e peça para ler" },
        { id: "l10", emoji: "🔡", label: "Corresponde maiúscula–minúscula", instruction: "Mostre pares de letras e pergunte: 'Essa grande e essa pequena são a mesma letra?'" },
        { id: "l11", emoji: "📖", label: "Reconhece nome dos colegas/família", instruction: "Mostre nomes escritos de pessoas conhecidas da criança e pergunte: 'O que está escrito?'" },
        { id: "l12", emoji: "✏️", label: "Copia frase simples de 3 palavras", instruction: "Peça para copiar uma frase curta, ex.: 'O gato come'" },
        { id: "l13", emoji: "🅰️", label: "Sons de vogais (A, E, I, O, U)", instruction: "Pergunte: 'Que som faz cada uma dessas letras?'" },
        { id: "l14", emoji: "🔡", label: "Sons de 5 consoantes (B,P,M,S,T)", instruction: "Mostre B, P, M, S, T e pergunte o som de cada uma" },
        { id: "l15", emoji: "🔤", label: "Conta sílabas em palavras simples", instruction: "Fale uma palavra (ex.: 'ca-sa', 'ca-va-lo') e pergunte: 'Quantas partes tem essa palavra?'" },
        { id: "l16", emoji: "📚", label: "Conhece a função de um livro", instruction: "Mostre um livro e pergunte: 'Para que serve isso?'" },
        { id: "l17", emoji: "🔤", label: "Identifica inicial de palavras", instruction: "Pergunte: 'Com que letra começa BOLA? E MACACO?'" },
        { id: "l18", emoji: "🖊️", label: "Escreve 5 letras sem modelo", instruction: "Peça para escrever 5 letras de memória sem copiar" },
      ],
    },
    {
      key: "animais",
      title: "Animais",
      emoji: "🐾",
      items: [
        { id: "a1", emoji: "🐱", label: "Gato", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a2", emoji: "🐶", label: "Cachorro", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a3", emoji: "🐦", label: "Pássaro", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a4", emoji: "🐟", label: "Peixe", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a5", emoji: "🐄", label: "Vaca", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a6", emoji: "🐴", label: "Cavalo", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a7", emoji: "🐔", label: "Galinha", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a8", emoji: "🐷", label: "Porco", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a9", emoji: "🐰", label: "Coelho", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a10", emoji: "🦋", label: "Borboleta", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a11", emoji: "🦁", label: "Leão", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a12", emoji: "🐘", label: "Elefante", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a13", emoji: "🐒", label: "Macaco", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a14", emoji: "🐊", label: "Jacaré", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a15", emoji: "🐢", label: "Tartaruga", instruction: "Mostre e pergunte: 'O que é esse animal?'" },
        { id: "a16", emoji: "🏠🌿", label: "Classifica: doméstico vs selvagem", instruction: "Pergunte: 'Esse animal vive com as pessoas ou na natureza?'" },
        { id: "a17", emoji: "🏠❓", label: "Habitat (onde mora?)", instruction: "Mostre figuras de animais e pergunte: 'Onde esse animal mora/vive?'" },
        { id: "a18", emoji: "🍖❓", label: "Alimentação (o que come?)", instruction: "Mostre figuras de animais e pergunte: 'O que esse animal come?'" },
      ],
    },
    {
      key: "corpo",
      title: "Partes do Corpo",
      emoji: "🧍",
      items: [
        { id: "b1", emoji: "👤", label: "Cabeça", instruction: "Aponte e pergunte: 'Onde fica a cabeça?'" },
        { id: "b2", emoji: "✋", label: "Mão", instruction: "Aponte e pergunte: 'Onde fica a mão?'" },
        { id: "b3", emoji: "🦶", label: "Pé", instruction: "Aponte e pergunte: 'Onde fica o pé?'" },
        { id: "b4", emoji: "👁️", label: "Olho", instruction: "Aponte e pergunte: 'Onde fica o olho?'" },
        { id: "b5", emoji: "👄", label: "Boca", instruction: "Aponte e pergunte: 'Onde fica a boca?'" },
        { id: "b6", emoji: "👃", label: "Nariz", instruction: "Aponte e pergunte: 'Onde fica o nariz?'" },
        { id: "b7", emoji: "👂", label: "Orelha", instruction: "Aponte e pergunte: 'Onde fica a orelha?'" },
        { id: "b8", emoji: "💇", label: "Cabelo", instruction: "Aponte e pergunte: 'Onde fica o cabelo?'" },
        { id: "b9", emoji: "🫃", label: "Barriga", instruction: "Aponte e pergunte: 'Onde fica a barriga?'" },
        { id: "b10", emoji: "💪", label: "Braço", instruction: "Aponte e pergunte: 'Onde fica o braço?'" },
        { id: "b11", emoji: "☝️", label: "Dedo", instruction: "Aponte e pergunte: 'Onde fica o dedo?'" },
        { id: "b12", emoji: "🦵", label: "Joelho", instruction: "Aponte e pergunte: 'Onde fica o joelho?'" },
        { id: "b13", emoji: "🧣", label: "Pescoço", instruction: "Aponte e pergunte: 'Onde fica o pescoço?'" },
        { id: "b14", emoji: "🤷", label: "Ombro", instruction: "Aponte e pergunte: 'Onde fica o ombro?'" },
        { id: "b15", emoji: "🦾", label: "Cotovelo", instruction: "Aponte e pergunte: 'Onde fica o cotovelo?'" },
        { id: "b16", emoji: "👃❓", label: "Função do nariz", instruction: "Pergunte: 'Para que serve o nariz?'" },
        { id: "b17", emoji: "👁️❓", label: "Função do olho", instruction: "Pergunte: 'Para que servem os olhos?'" },
        { id: "b18", emoji: "👂❓", label: "Função da orelha", instruction: "Pergunte: 'Para que serve a orelha?'" },
        { id: "b19", emoji: "❤️🫁🧠", label: "Órgãos internos (coração, pulmão, cérebro)", instruction: "Pergunte: 'Você conhece o coração? E o pulmão? E o cérebro? Para que cada um serve?'" },
        { id: "b20", emoji: "👉👈", label: "Lateralidade (direita/esquerda)", instruction: "Peça: 'Me mostre a sua mão direita. Agora a esquerda.'" },
      ],
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClassification(pct: number) {
  if (pct >= 80)
    return { label: "Adequado para a idade", color: "emerald", badge: "default" as const };
  if (pct >= 60)
    return { label: "Em desenvolvimento — estimulação recomendada", color: "amber", badge: "secondary" as const };
  if (pct >= 40)
    return { label: "Abaixo do esperado — investigar atraso", color: "orange", badge: "secondary" as const };
  return { label: "Significativamente abaixo — encaminhar para avaliação", color: "red", badge: "destructive" as const };
}

function classificationBg(pct: number) {
  if (pct >= 80) return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300";
  if (pct >= 60) return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300";
  if (pct >= 40) return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/40 text-orange-800 dark:text-orange-300";
  return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300";
}

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

export default function TestesReconhecimentoPage() {
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
      const earned = dom.items.reduce((sum, item) => sum + (scores[item.id] ?? 0), 0);
      const pct = maxPossible > 0 ? Math.round((earned / maxPossible) * 100) : 0;
      return {
        key: dom.key,
        title: dom.title,
        emoji: dom.emoji,
        maxPossible,
        earned,
        pct,
        answered: dom.items.filter((i) => scores[i.id] !== undefined && scores[i.id] !== null).length,
        total: dom.items.length,
      };
    });

    const totalMax = domainResults.reduce((s, d) => s + d.maxPossible, 0);
    const totalEarned = domainResults.reduce((s, d) => s + d.earned, 0);
    const totalPct = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
    const totalAnswered = domainResults.reduce((s, d) => s + d.answered, 0);
    const totalItems = domainResults.reduce((s, d) => s + d.total, 0);

    return { domainResults, totalMax, totalEarned, totalPct, totalAnswered, totalItems };
  }, [ageGroup, scores]);

  // Check if all items answered
  const allAnswered = useMemo(() => {
    if (!ageGroup || !results) return false;
    return results.totalAnswered === results.totalItems;
  }, [ageGroup, results]);

  // Build ClinicalReport props
  const reportItems = useMemo(() => {
    if (!ageGroup) return [];
    return DOMAIN_DEFS[ageGroup].flatMap((dom) =>
      dom.items.map((item) => {
        const val = scores[item.id] ?? 0;
        const answer =
          val === 2 ? "✅ Acertou" : val === 1 ? "🔶 Parcial" : "❌ Não acertou";
        return {
          question: `[${dom.title}] ${item.label} — ${item.instruction}`,
          answer,
          value: val,
        };
      })
    );
  }, [ageGroup, scores]);

  const _classification = results ? getClassification(results.totalPct) : null;

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
            <h1 className="text-lg font-bold text-foreground">Testes de Reconhecimento</h1>
            <p className="text-xs text-muted-foreground">Avaliação interativa para crianças de 2 a 7 anos</p>
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/20 p-4">
          <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
            <strong>Instruções:</strong> Estes testes são aplicados diretamente com a criança presente. O avaliador mostra cada item, realiza a pergunta indicada e registra se a criança reconheceu corretamente, parcialmente ou não reconheceu.
            Pontuação: <strong>✅ Acertou = 2 pts</strong> · <strong>🔶 Parcial = 1 pt</strong> · <strong>❌ Não acertou = 0 pts</strong>
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
                <Label htmlFor="child-name" className="text-xs font-medium">Nome da criança</Label>
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
                <Label htmlFor="child-age" className="text-xs font-medium">Idade (anos/meses)</Label>
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
                  <span className="text-xs font-semibold text-foreground">{ag.label}</span>
                  {ageGroup === ag.value && (
                    <CheckCircle2 className="w-4 h-4 text-violet-500" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => { if (ageGroup) setStep(2); }}
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
              <h1 className="text-base font-bold text-foreground">Testes de Reconhecimento</h1>
              {childName && (
                <p className="text-xs text-muted-foreground">
                  {childName}{childAge ? ` · ${childAge}` : ""} ·{" "}
                  {AGE_GROUPS.find((a) => a.value === ageGroup)?.label}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-1 text-xs">
            <ArrowLeft className="w-3 h-3" />
            Voltar
          </Button>
        </div>

        {/* Progress summary */}
        {results && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {results.domainResults.map((dom) => (
              <div key={dom.key} className="rounded-lg border border-border bg-card p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">{dom.emoji}</span>
                  <span className="text-xs font-semibold text-foreground truncate">{dom.title}</span>
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DomainKey)}>
          <TabsList className="w-full grid grid-cols-4">
            {domains.map((dom) => {
              const domResult = results?.domainResults.find((d) => d.key === dom.key);
              const allDone = domResult && domResult.answered === domResult.total;
              return (
                <TabsTrigger
                  key={dom.key}
                  value={dom.key}
                  className="text-xs gap-1"
                  data-testid={`tab-${dom.key}`}
                >
                  {dom.emoji}
                  <span className="hidden sm:inline">{dom.title}</span>
                  {allDone && <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {domains.map((dom) => (
            <TabsContent key={dom.key} value={dom.key} className="space-y-3 mt-3">
              {/* Domain header */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{dom.emoji}</span>
                <div>
                  <h2 className="text-sm font-bold text-foreground">{dom.title}</h2>
                  <p className="text-xs text-muted-foreground">{dom.items.length} itens</p>
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
                            <span className="text-2xl leading-none">{item.emoji}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.instruction}</p>
                              </div>
                              {/* Score indicator */}
                              {scored !== null && scored !== undefined && (
                                <Badge
                                  variant={scored === 2 ? "default" : scored === 1 ? "secondary" : "destructive"}
                                  className="flex-shrink-0 text-xs"
                                >
                                  {scored === 2 ? "✅ 2" : scored === 1 ? "🔶 1" : "❌ 0"}
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
                {domains.findIndex((d) => d.key === dom.key) < domains.length - 1 ? (
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
                  <span className="text-muted-foreground font-medium">Progresso total</span>
                  <span className="font-bold text-foreground">
                    {results.totalAnswered}/{results.totalItems} itens · {results.totalEarned}/{results.totalMax} pts
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
                    style={{ width: `${(results.totalAnswered / results.totalItems) * 100}%` }}
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
    const cls = getClassification(results.totalPct);

    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Resultado da Avaliação</h1>
              {childName && (
                <p className="text-xs text-muted-foreground">
                  {childName}{childAge ? ` · ${childAge}` : ""} ·{" "}
                  {AGE_GROUPS.find((a) => a.value === ageGroup)?.label}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="gap-1 text-xs">
              <ArrowLeft className="w-3 h-3" />
              Voltar
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1 text-xs">
              <RotateCcw className="w-3 h-3" />
              Novo Teste
            </Button>
          </div>
        </div>

        {/* Overall score card */}
        <Card className="border-violet-200 dark:border-violet-800/40 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Score circle */}
              <div className="flex-shrink-0 w-24 h-24 rounded-full bg-white dark:bg-card border-4 border-violet-400 flex flex-col items-center justify-center shadow-md">
                <span className="text-2xl font-black text-violet-700 dark:text-violet-300">
                  {results.totalPct}%
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">acertos</span>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Pontuação total</p>
                  <p className="text-xl font-bold text-foreground">
                    {results.totalEarned}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      / {results.totalMax} pontos
                    </span>
                  </p>
                </div>
                <div className={`rounded-lg border px-3 py-2 text-xs font-semibold ${classificationBg(results.totalPct)}`}>
                  {results.totalPct >= 80 ? "✅" : results.totalPct >= 60 ? "🟡" : results.totalPct >= 40 ? "🟠" : "🔴"}{" "}
                  {cls.label}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progressColor(results.totalPct)}`}
                  style={{ width: `${results.totalPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span>
                <span className="text-orange-500 font-medium">40% mín.</span>
                <span className="text-amber-500 font-medium">60% em dev.</span>
                <span className="text-emerald-500 font-medium">80% adequado</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classification legend */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-950/20 p-2.5">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">≥ 80%</span>
            <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">Adequado para a idade</p>
          </div>
          <div className="rounded-lg border border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-950/20 p-2.5">
            <span className="font-bold text-amber-700 dark:text-amber-400">60–79%</span>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">Em desenvolvimento</p>
          </div>
          <div className="rounded-lg border border-orange-200 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-950/20 p-2.5">
            <span className="font-bold text-orange-700 dark:text-orange-400">40–59%</span>
            <p className="text-orange-700 dark:text-orange-400 mt-0.5">Abaixo do esperado</p>
          </div>
          <div className="rounded-lg border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-950/20 p-2.5">
            <span className="font-bold text-red-700 dark:text-red-400">&lt; 40%</span>
            <p className="text-red-700 dark:text-red-400 mt-0.5">Encaminhar para avaliação</p>
          </div>
        </div>

        {/* Domain breakdown */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">Resultado por Domínio</h2>
          {results.domainResults.map((dom) => (
            <Card key={dom.key} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{dom.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{dom.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {dom.earned}/{dom.maxPossible} pts
                        </span>
                        <Badge
                          variant={
                            dom.pct >= 80 ? "default" : dom.pct >= 60 ? "secondary" : "destructive"
                          }
                          className="text-xs"
                        >
                          {dom.pct}%
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dom.answered}/{dom.total} itens respondidos
                    </p>
                  </div>
                </div>
                <Progress value={dom.pct} className="h-2" />
                <div className={`mt-2 text-xs font-medium px-2 py-1 rounded ${classificationBg(dom.pct)}`}>
                  {getClassification(dom.pct).label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed items by domain */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-foreground">Detalhamento por Item</h2>
          {domains.map((dom) => {
            const domResult = results.domainResults.find((d) => d.key === dom.key)!;
            return (
              <Card key={dom.key}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{dom.emoji}</span>
                    <h3 className="text-sm font-bold text-foreground">{dom.title}</h3>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {domResult.earned}/{domResult.maxPossible} pts
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {dom.items.map((item, _idx) => {
                      const val = scores[item.id] ?? 0;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                            val === 2
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300"
                              : val === 1
                              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300"
                              : "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300"
                          }`}
                        >
                          <span className="text-base flex-shrink-0">{item.emoji}</span>
                          <span className="flex-1 font-medium">{item.label}</span>
                          <span className="flex-shrink-0">
                            {val === 2 ? "✅ 2" : val === 1 ? "🔶 1" : "❌ 0"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Warn if unanswered */}
        {!allAnswered && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Atenção:</strong> {results.totalItems - results.totalAnswered} itens ainda não foram respondidos. Os resultados estão parciais. Itens não respondidos foram contados como 0.
            </p>
          </div>
        )}

        {/* Clinical Report */}
        <ClinicalReport
          scaleName="Testes de Reconhecimento para Menores"
          scaleFullName="Avaliação Interativa de Reconhecimento — Cores, Letras, Animais e Partes do Corpo"
          totalScore={results.totalEarned}
          maxScore={results.totalMax}
          classification={cls.label}
          description={`A criança ${childName ? `(${childName})` : ""} obteve ${results.totalEarned} de ${results.totalMax} pontos possíveis (${results.totalPct}%) na avaliação de reconhecimento para a faixa etária de ${AGE_GROUPS.find((a) => a.value === ageGroup)?.label}. ${cls.label}. Domínios avaliados: Cores (${results.domainResults.find((d) => d.key === "cores")?.pct}%), Letras (${results.domainResults.find((d) => d.key === "letras")?.pct}%), Animais (${results.domainResults.find((d) => d.key === "animais")?.pct}%), Partes do Corpo (${results.domainResults.find((d) => d.key === "corpo")?.pct}%).`}
          domainResults={results.domainResults.map((d) => ({
            domain: `${d.emoji} ${d.title}`,
            score: d.earned,
            classification: `${d.pct}% — ${getClassification(d.pct).label}`,
          }))}
          items={reportItems}
          patientAge={childAge || AGE_GROUPS.find((a) => a.value === ageGroup)?.label}
        />

        {/* Save to patient */}
        <SaveToPatient
          scaleName="Testes de Reconhecimento para Menores"
          totalScore={results.totalEarned}
          classification={cls.label}
          answers={scores}
          domainScores={Object.fromEntries(
            results.domainResults.map((d) => [d.key, { earned: d.earned, max: d.maxPossible, pct: d.pct }])
          )}
          patientAge={childAge || AGE_GROUPS.find((a) => a.value === ageGroup)?.label}
        />

        {/* Reset */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleReset}
          data-testid="btn-reset"
        >
          <RotateCcw className="w-4 h-4" />
          Nova Avaliação
        </Button>
      </div>
    );
  }

  return null;
}
