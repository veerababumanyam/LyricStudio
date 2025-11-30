import { UserRepository } from '../src/database/repositories/UserRepository.js';
import { initDatabase } from '../src/database/db.js';
import { PasswordService } from '../src/services/auth/password.service.js';

// Initialize database
initDatabase();

async function createTestUsers() {
    console.log('🧪 Creating test users...\n');

    const testUsers = [
        {
            email: 'john.doe@example.com',
            phoneNumber: '+1234567890',
            displayName: 'John Doe',
            password: 'Test123!'
        },
        {
            email: 'jane.smith@example.com',
            phoneNumber: '+1987654321',
            displayName: 'Jane Smith',
            password: 'SecurePass456!'
        },
        {
            email: 'bob.wilson@example.com',
            phoneNumber: '+1555123456',
            displayName: 'Bob Wilson',
            password: 'MyPassword789!'
        }
    ];

    for (const userData of testUsers) {
        try {
            // Check if user already exists
            const existing = UserRepository.findByEmail(userData.email);
            if (existing) {
                console.log(`⏭️  User ${userData.email} already exists, skipping...`);
                continue;
            }

            // Hash password
            const passwordHash = await PasswordService.hashPassword(userData.password);

            // Create user
            const user = UserRepository.createUser({
                email: userData.email,
                phone_number: userData.phoneNumber,
                password_hash: passwordHash,
                display_name: userData.displayName,
                auth_provider: 'local',
                email_verified: 1 // Mark as verified for testing
            });

            console.log(`✅ Created user: ${user.display_name} (${user.email})`);
            console.log(`   Phone: ${user.phone_number}`);
            console.log(`   Password: ${userData.password}`);
            console.log(`   ID: ${user.id}\n`);
        } catch (error) {
            console.error(`❌ Failed to create user ${userData.email}:`, error);
        }
    }

    // Display all users
    console.log('\n📊 All users in database:');
    console.log('═'.repeat(80));

    const db = await import('../src/database/db.js').then(m => m.getDatabase());
    const allUsers = db.prepare('SELECT id, email, phone_number, display_name, auth_provider, created_at FROM users').all();

    allUsers.forEach((user: any, index: number) => {
        console.log(`${index + 1}. ${user.display_name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone_number || 'N/A'}`);
        console.log(`   Provider: ${user.auth_provider}`);
        console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
        console.log('');
    });

    console.log(`\n✨ Total users: ${allUsers.length}`);
}

createTestUsers().catch(console.error);
