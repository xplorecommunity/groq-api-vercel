"use client"

import React, { useState } from 'react';

const Page = () => {
  const [data, setData] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState('');
  const [getResponse, setGetResponse] = useState('');

  const handleGet = async () => {
    try {
      const response = await fetch('api/generate', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const json = await response.json();
      setGetResponse(json.greeting);
    } catch (error) {
      console.error('Error fetching GET response:', error);
    }
  };

  const handlePost = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch('api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ "result":data }),
      });
      const json = await response.json();
      setResult(json.result);
    } catch (error) {
      console.error('Error fetching POST response:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Content Takeaway Bot</h1>
      <div>
        <button onClick={handleGet}>Get Greeting</button>
        {getResponse && <p>{getResponse}</p>}
      </div>
      <div style={{ marginTop: '20px' }}>
        <form onSubmit={handlePost}>
          <div>
            <label htmlFor="api-key">API Key:</label>
            <input
              id="api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ width: '100%', marginBottom: '10px' }}
            />
          </div>
          <div>
            <label htmlFor="data">Content:</label>
            <textarea
              id="data"
              placeholder="Enter content here..."
              value={data}
              onChange={(e) => setData(e.target.value)}
              style={{ width: '100%', height: '150px', marginBottom: '10px' }}
            />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>
            Generate Takeaways
          </button>
        </form>
        {result && (
          <div style={{ marginTop: '20px',overflow:"scroll" }}>
            <h2>Takeaways:</h2>
            <pre>{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;