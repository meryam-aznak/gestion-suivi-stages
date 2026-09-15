const bcrypt = require('bcrypt'); // ➡️ import bcrypt

// Seeder function
async function seedData() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('mery', 10); // 10 = salt rounds

    // Create a Utilisateur
    const newUser = new Utilisateur({
      nom: 'Aznak',
      prenom: 'Meryam',
      email: 'merya.aznak@example.com',
      "mdp": "$2b$10$LHRsU2e9eqQU3tqjDkFJxOLn2mYXLb/kCPLxl8DYbfkqV0EY9mSGW",
      role: 'Etudiant'
    });

    const savedUser = await newUser.save();
    console.log('✅ Utilisateur Created:', savedUser);

    // Create an Etudiant linked to that Utilisateur
    const newEtudiant = new Etudiant({
      codeApogee: '12345678',
      filiere: 'Informatique',
      promotion: '2025',
      statut: 'EN_COURS',
      utilisateur: savedUser._id
    });

    const savedEtudiant = await newEtudiant.save();
    console.log('✅ Etudiant Created:', savedEtudiant);

    process.exit();
  } catch (err) {
    console.error('❌ Error seeding data:', err);
    process.exit(1);
  }
}
