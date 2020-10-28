# Contributing

## Event Codes

### Zone Events

- `"Z0011` Zone Active
- `"Z0010` Zone Inactive
```
 +------------- Command
 | +----------- Event Type (Zone)
 | |  +-------- Zone Number
 | |  |  +----- Active (1), Inactive (0)
 | |  |  |

 " Z 001 1
```

### Area Events
- `"X0010` Area Activating (Arming)
- `"A0010` Area Active (Armed)
- `"D0010` Area Inactive (Disarmed)
- `"L0010` Area Triggered (Alarmed)
- `"E0010` Area Entry Triggered
```
 +------------- Command
 | +----------- Event Type
 | |  +-------- Area Number
 | |  |  +----- ???
 | |  |  |

 " A 001 1
```

### Other Events
- `"U0010` User Panel Triggered

## Commands

### `ASTATUS`
Response to `ASTATUS` commands:
- `"YN`
- `"NN`
