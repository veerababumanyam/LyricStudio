// Test script for local user authentication
const API_BASE_URL = 'http://localhost:3001/api/auth';

// Test credentials
const testUsers = [
    {
        email: 'john.doe@example.com',
        password: 'Test123!',
        name: 'John Doe'
    },
    {
        email: 'jane.smith@example.com',
        password: 'SecurePass456!',
        name: 'Jane Smith'
    },
    {
        email: 'bob.wilson@example.com',
        password: 'MyPassword789!',
        name: 'Bob Wilson'
    }
];

async function testLogin(email, password, name) {
    console.log(`\n🧪 Testing login for: ${name} (${email})`);
    console.log('━'.repeat(80));

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Login successful!');
            console.log('Response:', JSON.stringify(data, null, 2));
            
            // Extract cookies from response
            const cookies = response.headers.get('set-cookie');
            if (cookies) {
                console.log('🍪 Cookies set:', cookies);
            }
            
            return { success: true, data, cookies };
        } else {
            console.log('❌ Login failed!');
            console.log('Status:', response.status);
            console.log('Error:', JSON.stringify(data, null, 2));
            return { success: false, error: data };
        }
    } catch (error) {
        console.log('❌ Request failed!');
        console.log('Error:', error.message);
        return { success: false, error: error.message };
    }
}

async function testGetCurrentUser(cookies) {
    console.log('\n🔍 Testing /me endpoint with cookies...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/me`, {
            method: 'GET',
            headers: {
                'Cookie': cookies || ''
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Successfully retrieved current user');
            console.log('User:', JSON.stringify(data, null, 2));
            return { success: true, data };
        } else {
            console.log('❌ Failed to get current user');
            console.log('Status:', response.status);
            console.log('Error:', JSON.stringify(data, null, 2));
            return { success: false, error: data };
        }
    } catch (error) {
        console.log('❌ Request failed!');
        console.log('Error:', error.message);
        return { success: false, error: error.message };
    }
}

async function testInvalidLogin() {
    console.log('\n🧪 Testing invalid login...');
    console.log('━'.repeat(80));

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: 'john.doe@example.com', 
                password: 'WrongPassword123!' 
            }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.status === 401) {
            console.log('✅ Invalid login correctly rejected with 401');
            console.log('Error message:', data.error);
            return { success: true };
        } else {
            console.log('❌ Expected 401 status but got:', response.status);
            console.log('Response:', JSON.stringify(data, null, 2));
            return { success: false };
        }
    } catch (error) {
        console.log('❌ Request failed!');
        console.log('Error:', error.message);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Starting Authentication Tests');
    console.log('═'.repeat(80));
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // Test valid logins
    for (const user of testUsers) {
        const result = await testLogin(user.email, user.password, user.name);
        
        if (result.success) {
            results.passed++;
            results.tests.push({ user: user.name, status: 'PASS' });
            
            // Test /me endpoint with this user's cookies
            if (result.cookies) {
                const meResult = await testGetCurrentUser(result.cookies);
                if (meResult.success) {
                    results.passed++;
                    results.tests.push({ user: user.name, status: 'PASS', test: '/me endpoint' });
                } else {
                    results.failed++;
                    results.tests.push({ user: user.name, status: 'FAIL', test: '/me endpoint' });
                }
            }
        } else {
            results.failed++;
            results.tests.push({ user: user.name, status: 'FAIL' });
        }
    }

    // Test invalid login
    const invalidResult = await testInvalidLogin();
    if (invalidResult.success) {
        results.passed++;
        results.tests.push({ user: 'Invalid credentials test', status: 'PASS' });
    } else {
        results.failed++;
        results.tests.push({ user: 'Invalid credentials test', status: 'FAIL' });
    }

    // Summary
    console.log('\n\n📊 Test Summary');
    console.log('═'.repeat(80));
    console.log(`Total tests: ${results.passed + results.failed}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log('\nDetailed Results:');
    results.tests.forEach((test, index) => {
        const icon = test.status === 'PASS' ? '✅' : '❌';
        const testInfo = test.test ? ` (${test.test})` : '';
        console.log(`${index + 1}. ${icon} ${test.user}${testInfo}`);
    });

    if (results.failed === 0) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the output above for details.');
    }
}

// Run the tests
runTests().catch(console.error);
