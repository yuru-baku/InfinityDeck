[![Deploy Backend](https://github.com/yuru-baku/InfintyDeck/actions/workflows/main_infinitydeck.yml/badge.svg)](https://github.com/yuru-baku/InfintyDeck/actions/workflows/main_infinitydeck.yml)
[![Deploy Frontend](https://github.com/yuru-baku/InfintyDeck/actions/workflows/deploy-vue_config.yml/badge.svg)](https://github.com/yuru-baku/InfintyDeck/actions/workflows/deploy-vue_config.yml)
# Links:
[Live Page](https://yuru-baku.github.io/InfintyDeck/)
[Kanban](https://miro.com/welcomeonboard/Y0pHWlpaUjEwR0RYSjBvZjFmMDYwcXRKRVhmY2M2a2FKY0ZJdFRvOU1qM01qVTUyRzdkbHVJTnc4TmhZa0RJQ3wzNDU4NzY0NTc0NzE4Mzk3MjYyfDI=?share_link_id=690598034590)

# Syncing Cards
```mermaid
---
title: Server view of card synchronisation
---
sequenceDiagram
	participant John
	participant Server
	participant Alice
	
	Note over John,Alice : Sync cards with Server
	activate Server
	Server -->>+ Alice: async getCards()
	Server -->>+ John: async getCards()
	Server -->> Server: await all answers
	Alice -->>- Server: myCards
	John -->>- Server: myCards
    deactivate Server
    
	Note over John,Alice: Broadcast cards to participants
	activate Server
	Server -->>+ Alice: allCards
	deactivate Alice
	Server -->>+ John: allCards
	deactivate John
	deactivate Server
```

```mermaid
---
title: Client view of card sending
---
sequenceDiagram
	participant Server
	participant ConnectionService
	participant CardService
	participant AFrame
	participant Zones
	activate Server
	Server -->>+ ConnectionService: async getCards()
	ConnectionService ->>+ CardService: welche karten sind aktiv?
	CardService ->>+ AFrame: getFoundMarkers()
	AFrame -->>- CardService: foundMarkers
	CardService ->>+ Zones: which cards are in which zone?
	Zones -->>- CardService: zone info of the cards
	CardService -->> CardService: construct card objects
	CardService -->>- ConnectionService: card objects
	ConnectionService -->>- Server: myCards
	deactivate Server
```

```mermaid
---
title: Client view of card broadcast
---
sequenceDiagram
	participant Server
	participant ConnectionService
	participant CardService
	participant AFrame
	activate Server
	Server -->>+ ConnectionService: async allCards
    ConnectionService -->>+ CardService: allCards
    CardService ->> CardService: transform card objects
    CardService ->>+ AFrame: setCards(allCards)
    AFrame -->>- CardService: void
    CardService -->>- ConnectionService: void
     
	activate AFrame
    AFrame -->>- AFrame: render
    deactivate ConnectionService

```