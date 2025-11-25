/**
 * Script de migración para hashear contraseñas existentes
 * 
 * IMPORTANTE: Ejecutar este script UNA SOLA VEZ después de actualizar el código
 * Si se ejecuta múltiples veces, las contraseñas quedarán doblemente hasheadas
 * 
 * Uso: node migrate-passwords.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tournament';

// Schema simplificado para migración (sin el pre-save hook)
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function migratePasswords() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Conectado a MongoDB');

    // Obtener todos los usuarios
    const users = await User.find({});
    console.log(`\n📋 Encontrados ${users.length} usuarios para revisar\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Verificar si la contraseña ya está hasheada (bcrypt hash comienza con $2)
      if (user.password.startsWith('$2')) {
        console.log(`⏭️  ${user.username}: Contraseña ya hasheada, saltando...`);
        skippedCount++;
        continue;
      }

      // Hashear la contraseña en texto plano
      console.log(`🔐 ${user.username}: Hasheando contraseña...`);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      // Actualizar directamente en la base de datos
      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log(`✓  ${user.username}: Contraseña migrada exitosamente`);
      migratedCount++;
    }

    console.log('\n========================================');
    console.log('📊 RESUMEN DE MIGRACIÓN:');
    console.log(`   ✓ Contraseñas migradas: ${migratedCount}`);
    console.log(`   ⏭️  Saltadas (ya hasheadas): ${skippedCount}`);
    console.log(`   📋 Total usuarios: ${users.length}`);
    console.log('========================================\n');

    if (migratedCount > 0) {
      console.log('⚠️  IMPORTANTE: Las contraseñas originales ya no funcionarán.');
      console.log('   Los usuarios deben usar las mismas contraseñas de antes.');
      console.log('   Si hay problemas, pueden usar el endpoint de registro.\n');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  }
}

// Ejecutar migración
migratePasswords();
