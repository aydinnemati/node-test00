const http = require("http");
const fs = require('fs');

const hostA = 'localhost';
const portA = 8000;
const hostB = 'localhost';
const portB = 7000;

const serverA = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === "/adduser") {
    let requestBody = '';
    req.on('data', (chunk) => {
      requestBody += chunk.toString();
    });

    req.on('end', () => {
      const options = {
        hostname: hostB,
        port: portB,
        path: '/adduser',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const forwardReq = http.request(options, forwardRes => {
        let responseData = '';
        forwardRes.on('data', chunk => {
          responseData += chunk;
        });

        forwardRes.on('end', () => {
          res.writeHead(forwardRes.statusCode, forwardRes.headers);
          res.end(responseData);
        });
      });

      forwardReq.on('error', error => {
        console.error('Error forwarding request:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
      });

      forwardReq.write(requestBody);
      forwardReq.end();
    });
  } else if (req.method === 'GET' && req.url === "/") {

    const options = {
      hostname: hostB,
      port: portB,
      path: '/',
      method: 'GET',
    };

    const forwardReq = http.request(options, forwardRes => {
      let responseData = '';
      forwardRes.on('data', chunk => {
        responseData += chunk;
      });

      forwardRes.on('end', () => {
        res.writeHead(forwardRes.statusCode, forwardRes.headers);
        res.end(responseData);
      });
    });

    forwardReq.on('error', error => {
      console.error('Error forwarding request:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    });

    // forwardReq.write(requestBody);
    forwardReq.end();      

  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

serverA.listen(portA, hostA, () => {
  console.log(`Server A running at http://${hostA}:${portA}/`);
});

const serverB = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === "/adduser") {
    let requestBody = '';
    req.on('data', (chunk) => {
      requestBody += chunk.toString();
    });

    req.on('end', () => {
      try {
        const user = JSON.parse(requestBody);
        const usersFile = 'users.txt';
        let usersArray = [];

        if (fs.existsSync(usersFile)) {
          const stringArray = fs.readFileSync(usersFile, { encoding: 'utf8' });
          usersArray = JSON.parse(stringArray);
        }

        usersArray.push(user);
        fs.writeFileSync(usersFile, JSON.stringify(usersArray));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "User added successfully" }));
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(400);
        res.end('Bad Request');
      }
    });
  } else if (req.method === 'GET' && req.url === "/") {
    
    const stringArray = fs.readFileSync("users.txt", { encoding: 'utf8' });
    res.writeHead(200);
    res.end(stringArray)
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

serverB.listen(portB, hostB, () => {
  console.log(`Server B running at http://${hostB}:${portB}/`);
});
