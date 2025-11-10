// Super simple test - no router, no imports that could fail
function App() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#36454F', fontSize: '32px' }}>✅ Petflix is Working!</h1>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>
        If you see this, React is rendering correctly.
      </p>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#ADD8E6', borderRadius: '8px' }}>
        <h2>Test Backend Connection:</h2>
        <button 
          onClick={async () => {
            try {
              const res = await fetch('http://localhost:3000/health');
              const data = await res.json();
              alert('Backend is working!\n' + JSON.stringify(data, null, 2));
            } catch (err) {
              alert('Backend error: ' + err);
            }
          }}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            backgroundColor: '#36454F',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Test Backend Health
        </button>
      </div>
    </div>
  );
}

export default App;
