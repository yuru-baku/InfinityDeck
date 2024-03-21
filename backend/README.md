# The Backend
## Setup
To start this project you will need to have node.js with a version over 20.0.0 installed.
With that run 
```bash
npm install
npm run build
npm run start
```
or use `npm run dev` to start developing.
In any case you will need a running MongoDB instance somewhere.
For example you can pull a docker image:
```bash
docker pull mongodb/mongodb-community-server
sudo docker run --name infinity_deck -d -p 27017:27017 mongodb/mongodb-community-server:latest
```
If you want to use another instance, you will need to update the [`.env`-file](./.env).

## Communication
```mermaid
sequenceDiagram
participant C as Client
participant S as Server

C->>S: connect
S->>C: { action: 'joined', data: { roomId: string, isOwner: boolean }}

loop in lobby
  C->>S: { action: 'changeGame' }
  S->>C: { action: 'gameChanged', data: { selectedGame: string }}
  
  C->>S: { action: 'changeSettings' }
  S->>C: { action: 'settingsChanged', data: { isLocal: boolean }}
end

C->>S: { action: 'start' }
S->>C: { action: 'dealCards', data: { }}

loop in game
  alt drawing card
    C->>S: { action: 'drawCard' }
    opt if drawPile was empty
      S->>C: { action: 'shuffled' }
    end
    opt if there are unused markers
      S->>C: { action: 'freedMarkers', data: { markers: string[] }}
    end
    S->>C: { action: 'cardDrawen', data: { card: Card, markerId: string }}
  else shuffle manually
    C->>S: { action: 'shuffleDrawPile' }
    S->>C: { action: 'shuffled' }
    opt if there are unused markers
      S->>C: { action: 'freedMarkers', data: { markers: string[] }}
    end
  end
end

C->>S: { action: 'shuffleDrawPile' }
S->>C: { action: 'shuffled' }
C->>S: { action: 'end' }
```
