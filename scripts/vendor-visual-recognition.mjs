import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Maintenance only. The application and builds use committed, local assets.
const revision = '9cbab9f400c5de44e2bc58839cca07294aadb086';
const repository = 'mulberrysymbols/mulberry-symbols';
const output = 'client/public/recognition-v2';
const definitions = [
 ['cachorro','animais','Cachorro',12,['dog']], ['gato','animais','Gato',12,['cat']],
 ['coelho','animais','Coelho',24,['rabbit']], ['peixe','animais','Peixe',12,['fish']],
 ['passaro','animais','Pássaro',24,['bird']], ['vaca','animais','Vaca',24,['cow']],
 ['cavalo','animais','Cavalo',24,['horse']], ['galinha','animais','Galinha',24,['hen','chicken']],
 ['porco','animais','Porquinho',36,['piglet']], ['ovelha','animais','Ovelha',36,['sheep']],
 ['pato','animais','Pato',24,['duck']], ['borboleta','animais','Borboleta',36,['butterfly']],
 ['abelha','animais','Abelha',48,['bee_honey']], ['tartaruga','animais','Jabuti',36,['tortoise']],
 ['sapo','animais','Sapo',36,['frog']], ['elefante','animais','Elefante',48,['elephant']],
 ['leao','animais','Leão',48,['lion']], ['girafa','animais','Girafa',48,['giraffe']],
 ['banana','frutas','Banana',12,['banana']], ['maca','frutas','Maçã',24,['apple']],
 ['laranja','frutas','Laranja',24,['orange']], ['pera','frutas','Pera',36,['pear']],
 ['uva','frutas','Uva',24,['grapes']], ['morango','frutas','Morango',36,['strawberry']],
 ['abacaxi','frutas','Abacaxi',36,['pineapple']], ['melancia','frutas','Melancia',36,['watermelon']],
 ['limao','frutas','Limão-siciliano',60,['lemon']], ['pessego','frutas','Pêssego',60,['peach']],
 ['manga','frutas','Manga',36,['mango']], ['coco','frutas','Coco',48,['coconut']],
 ['carro','transportes','Carro',12,['car']], ['onibus','transportes','Ônibus',24,['bus']],
 ['bicicleta','transportes','Bicicleta',24,['bicycle','bike']], ['moto','transportes','Motocicleta',36,['motorbike','motorcycle']],
 ['caminhao','transportes','Caminhão',36,['lorry','truck']], ['aviao','transportes','Avião',24,['aeroplane','airplane','plane']],
 ['barco','transportes','Barco',36,['boat','rowing_boat']], ['trem','transportes','Trem',48,['train']],
 ['helicoptero','transportes','Helicóptero',48,['helicopter']], ['ambulancia','transportes','Ambulância',60,['ambulance']],
 ['bola','objetos','Bola',12,['ball']], ['caneca','objetos','Caneca',24,['mug']],
 ['colher','objetos','Colher',12,['spoon']], ['prato','objetos','Prato',24,['plate']],
 ['tigela','objetos','Tigela',36,['bowl']], ['garrafa','objetos','Garrafa de leite',36,['milk_bottle']],
 ['cadeira','objetos','Cadeira',24,['chair']], ['mesa','objetos','Mesa',24,['table']],
 ['cama','objetos','Cama',24,['single_bed']], ['tesoura','objetos','Tesoura',48,['scissors']],
 ['lapis','objetos','Lápis',36,['pencil']], ['sapato','objetos','Sapato',24,['shoe_-_mans']],
 ['meia','objetos','Meia',36,['sock','socks']], ['chapeu','objetos','Chapéu',48,['hat_-_mans']],
 ['escova','objetos','Escova de dentes',36,['toothbrush']], ['pente','objetos','Pente',36,['comb']],
 ['chave','objetos','Chave',48,['key_1']], ['guarda-chuva','objetos','Guarda-chuva',36,['umbrella']],
];
const get = async (url) => {
 const response = await fetch(url, {signal: AbortSignal.timeout(30000), headers:{'User-Agent':'NeuroPed-visual-assets'}});
 if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
 return response.text();
};
const tree = JSON.parse(await get(`https://api.github.com/repos/${repository}/git/trees/${revision}?recursive=1`));
if (tree.truncated) throw new Error('Incomplete upstream tree');
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const sources = tree.tree.filter(entry => entry.type==='blob' && /^EN\/[^/]+\.svg$/.test(entry.path));
const missing = [];
const chosen = definitions.map(([id,category,label,minMonths,aliases]) => {
 const source = aliases.map(alias => sources.find(entry => normalize(entry.path)===`en/${alias}.svg`)).find(Boolean);
 if (!source) missing.push({id,aliases,similar:sources.filter(entry=>aliases.some(alias=>normalize(entry.path).includes(alias))).map(entry=>entry.path).slice(0,12)});
 return {id:normalize(id),category,label,minMonths,source};
});
if(missing.length) throw new Error(`Missing exact sources: ${JSON.stringify(missing)}`);
await mkdir(output,{recursive:true});
const manifest=[];
for(const item of chosen){
 const original = await get(`https://raw.githubusercontent.com/${repository}/${revision}/${item.source.path}`);
 const blob = createHash('sha1').update(`blob ${Buffer.byteLength(original)}\0`).update(original).digest('hex');
 if(blob!==item.source.sha) throw new Error(`Upstream integrity failed: ${item.id}`);
 const svg = original.replace(/<\?xml[\s\S]*?\?>/gi,'').replace(/<!DOCTYPE[\s\S]*?>/gi,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<(metadata|title|desc)\b[^>]*>[\s\S]*?<\/\1>/gi,'').trim();
 if(!/<svg\b/.test(svg) || /<(script|foreignObject|image|text)\b|\son\w+\s*=|(?:href\s*=\s*["']\s*(?:https?:|\/\/|data:|javascript:))|url\(\s*["']?https?:/i.test(svg)) throw new Error(`Unsafe or answer-bearing SVG: ${item.id}`);
 await writeFile(`${output}/${item.id}.svg`, svg+'\n');
 manifest.push({id:item.id,category:item.category,label:item.label,minMonths:item.minMonths,sourcePath:item.source.path,sourceSha:item.source.sha,sha256:createHash('sha256').update(svg+'\n').digest('hex'),license:'CC-BY-SA-4.0',author:'Steve Lee',revision,review:'illustration-not-normed'});
}
const license=await get(`https://raw.githubusercontent.com/${repository}/${revision}/LICENSE.txt`);
if(!license.includes('https://creativecommons.org/licenses/by-sa/4.0/')) throw new Error('License changed');
await writeFile(`${output}/LICENSE.txt`,license);
await writeFile(`${output}/manifest.json`,JSON.stringify({version:'2026-09-23.2',source:repository,revision,adaptation:'Remoção de metadados, títulos e descrições XML; desenho preservado. Rótulos PT-BR são descritores locais, não normas.',items:manifest},null,2)+'\n');
console.log(`VENDORED ${manifest.length} checked local illustrations; no production requests to upstream.`);
