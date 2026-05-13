const BASE_URL = 'http://localhost:8080';

async function test() {
    console.log('--- TEST 3: Generate API Key ---');
    let apiKey;
    try {
        const res = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'tester_flow_3@example.com' })
        });
        const data = await res.json();
        console.log('Result:', res.status, data);
        apiKey = data.api_key;
    } catch (err) {
        console.log('Error:', err.message);
    }

    if (!apiKey) return;

    console.log('\n--- TEST 4: Optimize Price with Valid Key ---');
    try {
        const res = await fetch(`${BASE_URL}/api/optimize-price`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Origin': 'https://example-store.com'
            },
            body: JSON.stringify({ base_price: 10, country: 'IN', currency: 'USD' })
        });
        const data = await res.json();
        console.log('Result:', res.status, data);
    } catch (err) {
        console.log('Error:', err.message);
    }
}

test();
