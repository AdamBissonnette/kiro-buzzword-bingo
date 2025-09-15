// Test the URL sharing functionality
const testCard = {
    title: "Test Bingo Card",
    terms: [
        "synergy", "paradigm", "leverage", "optimize", "streamline",
        "innovative", "disruptive", "scalable", "agile", "robust",
        "seamless", "cutting-edge", "best-practice", "game-changer", "value-add",
        "low-hanging-fruit", "circle-back", "touch-base", "deep-dive", "pivot",
        "bandwidth", "deliverable", "actionable", "holistic"
    ],
    freeSpaceIcon: "star"
};

function encodeCardData(cardData) {
    const jsonString = JSON.stringify(cardData);
    const base64 = Buffer.from(jsonString).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function decodeCardData(encodedData) {
    let base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    const jsonString = Buffer.from(base64, 'base64').toString();
    return JSON.parse(jsonString);
}

try {
    console.log('🧪 Testing URL sharing functionality...\n');
    
    // Test encoding
    const encoded = encodeCardData(testCard);
    console.log('✅ Encoding successful');
    console.log('Encoded length:', encoded.length);
    
    // Test decoding
    const decoded = decodeCardData(encoded);
    console.log('✅ Decoding successful');
    
    // Verify data integrity
    const titleMatch = testCard.title === decoded.title;
    const termsMatch = JSON.stringify(testCard.terms) === JSON.stringify(decoded.terms);
    const iconMatch = testCard.freeSpaceIcon === decoded.freeSpaceIcon;
    
    console.log('\n📊 Data integrity check:');
    console.log('Title match:', titleMatch ? '✅' : '❌');
    console.log('Terms match:', termsMatch ? '✅' : '❌');
    console.log('Icon match:', iconMatch ? '✅' : '❌');
    
    if (titleMatch && termsMatch && iconMatch) {
        console.log('\n🎉 All tests passed! Sharing functionality works correctly.');
        
        // Generate test URL
        const testUrl = `http://localhost:5174/?play=true&data=${encoded}`;
        console.log('\n🔗 Test URL:');
        console.log(testUrl);
        console.log('\nURL length:', testUrl.length);
        
        if (testUrl.length > 2000) {
            console.log('⚠️  Warning: URL is quite long, may have issues in some browsers');
        } else {
            console.log('✅ URL length is acceptable for sharing');
        }
    } else {
        console.log('\n❌ Data integrity check failed!');
    }
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
}