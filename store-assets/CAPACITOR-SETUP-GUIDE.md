# Guia de Configuração do Capacitor — NeuroPed Escalas

## Pré-requisitos

### Para iOS:
- macOS com Xcode 15+ instalado
- Apple Developer Account ($99/ano)
- CocoaPods: `sudo gem install cocoapods`
- Node.js 18+

### Para Android:
- Android Studio Hedgehog+ instalado
- Google Play Developer Account ($25 taxa única)
- Java JDK 17+
- Node.js 18+

---

## Passo a Passo

### 1. Instalar Capacitor

```bash
cd neuropediatria
npm install @capacitor/core @capacitor/cli
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard
```

### 2. Inicializar Capacitor

```bash
npx cap init "NeuroPed Escalas" "com.drjadsonfraga.neuropedescalas" --web-dir dist/public
```

O arquivo `capacitor.config.ts` já está pronto na raiz do projeto.

### 3. Build do projeto web

```bash
npm run build
```

### 4. Adicionar plataformas

```bash
# iOS
npx cap add ios

# Android
npx cap add android
```

### 5. Copiar ícones

#### iOS:
Copie os ícones de `store-assets/icons-ios/` para:
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
```
Atualize o `Contents.json` com os tamanhos corretos.

#### Android:
Copie os ícones de `store-assets/icons-android/` para:
```
android/app/src/main/res/mipmap-mdpi/   → icon-mdpi-48x48.png (renomear para ic_launcher.png)
android/app/src/main/res/mipmap-hdpi/   → icon-hdpi-72x72.png
android/app/src/main/res/mipmap-xhdpi/  → icon-xhdpi-96x96.png
android/app/src/main/res/mipmap-xxhdpi/ → icon-xxhdpi-144x144.png
android/app/src/main/res/mipmap-xxxhdpi/→ icon-xxxhdpi-192x192.png
```

### 6. Copiar Splash Screens

#### iOS:
Coloque `splash-ios.png` em:
```
ios/App/App/Assets.xcassets/Splash.imageset/
```

#### Android:
Coloque `splash-android.png` em:
```
android/app/src/main/res/drawable/splash.png
```

### 7. Sincronizar e abrir

```bash
npx cap sync

# Abrir no Xcode
npx cap open ios

# Abrir no Android Studio
npx cap open android
```

### 8. Configurar para Produção

#### iOS (Xcode):
1. Selecione "Any iOS Device" como target
2. Product → Archive
3. Distribute App → App Store Connect
4. Upload

#### Android (Android Studio):
1. Build → Generate Signed Bundle / APK
2. Selecione Android App Bundle (.aab)
3. Crie ou use sua keystore
4. Gere o build de release

---

## Configurar nas Stores

### Apple App Store:
1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Crie novo App com Bundle ID: `com.drjadsonfraga.neuropedescalas`
3. Preencha com textos de `store-listing-pt-br.md`
4. Faça upload dos screenshots de `store-assets/screenshots/`
5. Defina preço: Tier 3 (~R$20,00 / $3.99 USD)
6. Adicione URL da Política de Privacidade
7. Submeta para review

### Google Play:
1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie novo App
3. Preencha com textos de `store-listing-pt-br.md`
4. Faça upload dos screenshots e Feature Graphic
5. Defina preço: R$20,00
6. Adicione URL da Política de Privacidade e Termos de Uso
7. Complete a declaração de conteúdo
8. Submeta para review

---

## Estrutura dos Assets

```
store-assets/
├── icons-ios/              # 13 tamanhos (20px → 1024px)
├── icons-android/          # 6 tamanhos (mdpi → playstore 512px)
├── screenshots/            # 6 screenshots profissionais
│   ├── screenshot-01-login.png
│   ├── screenshot-02-dashboard.png
│   ├── screenshot-03-filtro.png
│   ├── screenshot-04-escala.png
│   ├── screenshot-05-relatorio.png
│   └── screenshot-06-prontuario.png
├── splash/
│   ├── splash-ios.png
│   └── splash-android.png
├── feature-graphic.png     # Google Play banner 1024x500
├── store-listing-pt-br.md  # Texto PT-BR completo
├── store-listing-en.md     # Texto EN completo
├── privacy-policy.html     # Política de Privacidade
├── terms-of-use.html       # Termos de Uso
└── CAPACITOR-SETUP-GUIDE.md # Este guia
```

## Informações da Conta

- **App ID:** com.drjadsonfraga.neuropedescalas
- **Nome:** NeuroPed Escalas
- **Desenvolvedor:** Dr. Jadson Fraga Araújo Júnior
- **E-mail:** jadsonfraga@hotmail.com
- **Preço:** R$ 20,00
- **Categoria:** Medical
- **Classificação:** 17+
