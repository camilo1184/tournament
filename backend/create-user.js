const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/tournament', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createUser(username, password) {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`❌ El usuario "${username}" ya existe`);
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const newUser = new User({
      username,
      password: hashedPassword
    });

    await newUser.save();
    console.log(`✅ Usuario "${username}" creado exitosamente`);
    console.log(`   Contraseña hasheada: ${hashedPassword.substring(0, 20)}...`);
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Obtener username y password de argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Uso: node create-user.js <username> <password>');
  console.log('Ejemplo: node create-user.js admin miClaveSegura123');
  process.exit(1);
}

const [username, password] = args;

console.log(`🔐 Creando usuario "${username}"...`);
createUser(username, password);
