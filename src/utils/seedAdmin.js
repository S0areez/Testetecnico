import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const createAdminAccount = async () => {
  const adminEmail = 'admin@nexlab.com';
  const adminPassword = 'adminpassword123';

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;

    await setDoc(doc(db, 'users', user.uid), {
      email: adminEmail,
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    console.log('Admin account created successfully!');
    alert('Conta Admin criada com sucesso!\nEmail: ' + adminEmail + '\nSenha: ' + adminPassword);
  } catch (error) {
    console.error('Error creating admin account:', error);
    alert('Erro ao criar admin: ' + error.message);
  }
};
