
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// Provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyBkZW1PkujJhb1EzKtR8KM5PRh88BZp0RI",
  authDomain: "cantina-icone.firebaseapp.com",
  databaseURL: "https://cantina-icone-default-rtdb.firebaseio.com",
  projectId: "cantina-icone",
  storageBucket: "cantina-icone.appspot.com",
  messagingSenderId: "206547683119",
  appId: "1:206547683119:web:30d66cdd467e97eb2643da",
  measurementId: "G-10SRT3H1SE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getDatabase(app);


/*
  [!] CORREÇÃO PARA ERROS DE AUTENTICAÇÃO DO FIREBASE:
  Se você está recebendo erros como 'auth/configuration-not-found' ou 'auth/operation-not-allowed',
  isso significa que o método de login por "E-mail/Senha" não está ativado no seu projeto Firebase.

  Para corrigir, siga estes passos:
  1. Acesse o Console do Firebase: https://console.firebase.google.com/
  2. Selecione o seu projeto ("cantina-icone").
  3. No menu à esquerda, vá para "Authentication".
  4. Clique na aba "Sign-in method" (ou "Método de login").
  5. Na lista de provedores, encontre e clique em "E-mail/senha".
  6. Ative o provedor e clique em "Salvar".

  Após completar esses passos, o login e o cadastro no seu aplicativo funcionarão corretamente.
  Nenhuma outra alteração no código é necessária para resolver este problema específico.
*/
