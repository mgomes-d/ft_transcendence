import { io, Socket } from "socket.io-client";
import { useRef, useEffect, useState, createContext, useContext } from "react";
import * as gm from "./gameLogic";
import { notifyError } from "../utils/notifications";
import { Separator } from "./Separator";
import lobbyStyles from "./GameLobby.module.scss";
import winStyles from "./GameWin.module.scss";
import pongStyles from "./GamePong.module.scss";

const SOCK_HOST = import.meta.env.VITE_BACK_URL;
const gameSocket = io(`${SOCK_HOST}/gamesocket`, {
  withCredentials: true,
});
const SocketContext = createContext<Socket>(gameSocket);

/* -------------------------------------------------------------------------- */
/*                                     Game                                   */
/* -------------------------------------------------------------------------- */

export default function GameElement() {
  let sockRef = useRef<Socket>(gameSocket);

  useEffect(() => {
    sockRef.current.on("gameSocketError", (errmsg: string) => {
      notifyError(errmsg);
    });

    return () => {
      sockRef.current.off("gameSocketError");
    };
  }, []);

  return (
    <SocketContext.Provider value={sockRef.current}>
      <GameElementContent />
    </SocketContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*                             GameElementContent                             */
/* -------------------------------------------------------------------------- */

enum UserStatus {
  Normal,
  Waiting,
  Playing,
}

function GameElementContent() {
  enum WinLose {
    NA = 0,
    Win,
    Lose,
  }
  const socket = useContext(SocketContext);
  const [status, setStatus] = useState<UserStatus | undefined>(undefined);
  const [winLose, setWinLose] = useState(WinLose.NA);

  // authenticate and get status + log
  // set hooks for changes of status
  useEffect(() => {
    socket.emit("getStatus", (gotStatus: UserStatus | undefined) => {
      setStatus(gotStatus);
    });

    socket.on("statusChange", (gotStatus: UserStatus) => {
      setStatus(gotStatus);
    });
    socket.on("winLose", (gotWin: boolean) => {
      setWinLose(gotWin ? WinLose.Win : WinLose.Lose);
    });

    return () => {
      socket.emit("cancel", { silent: true });
      socket.off("statusChange");
      socket.off("winLose");
    };
  }, []);

  function WinScreen({ win = true }) {
    return (
      <div className={winStyles.container}>
        <div className={winStyles.winContainer}>
          <h1>YOU {win ? "WIN" : "LOSE"}!</h1>
          <button onClick={() => setWinLose(WinLose.NA)}>Back to lobby</button>
        </div>
      </div>
    );
  }

  let content = <></>;
  if (winLose != WinLose.NA) {
    content = <WinScreen win={winLose === WinLose.Win} />;
  } else {
    switch (status) {
      case undefined:
        content = <></>;
        break;
      case UserStatus.Playing:
//         content = <PongBoard availWidth={1020} availHeight={768} />;
        content = <PongBoard availWidth={600} availHeight={400} />;
        break;
      case UserStatus.Waiting:
        content = (
          <div className={lobbyStyles.container}>
            <GamesLobby waiting={true} />
          </div>
        );
        break;
      case UserStatus.Normal:
        content = (
          <div className={lobbyStyles.container}>
            <GamesLobby waiting={false} />
          </div>
        );
        break;
    }
  }

  return content;
}

/* -------------------------------------------------------------------------- */
/*                                 GamesLobby                                 */
/* -------------------------------------------------------------------------- */

type GameInfo = {
  id: number;
  name: string;
  host: string;
  type: string;
  rating: number;
};

function GamesLobby({ waiting = false }) {
  type GamesList = Array<GameInfo>;
  const socket = useContext(SocketContext);
  const [gamesInfo, setGamesInfo] = useState<GamesList>([]);

  function CreateGame() {
    const [basicMatchName, setBasicMatchName] = useState<string>("");
    const [customMatchName, setCustomMatchName] = useState<string>("");
    let mapChoice = useRef<null | HTMLSelectElement>(null);
    let maps = new gm.WallGame().maps;

    const createBasicMatch = (e: React.FormEvent) => {
      e.preventDefault();
      socket.emit("createInvite", { gameName: basicMatchName });
      setBasicMatchName("");
    };

    const createCustomMatch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!mapChoice.current) return;
      socket.emit("createInvite", {
        gameName: customMatchName,
        type: "wall",
        args: { mapName: mapChoice.current.value },
      });
      setCustomMatchName("");
    };

    return (
      <div className={lobbyStyles.options}>
        <form onSubmit={createBasicMatch}>
          <h2>Create a basic match</h2>
          <label>Match Name</label>
          <input
            type="text"
            value={basicMatchName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setBasicMatchName(e.target.value)
            }
            placeholder="Enter a match name"
            required
            disabled={waiting}
          />
          {waiting ? (
            <button
              className={lobbyStyles.disabled}
              type="submit"
              disabled={waiting}
            >
              Create basic match
            </button>
          ) : (
            <button
              className={lobbyStyles.enabled}
              type="submit"
              disabled={waiting}
            >
              Create basic match
            </button>
          )}
        </form>
        <form onSubmit={createCustomMatch}>
          <h2>Create a custom match</h2>
          <label>Match Name</label>
          <input
            type="text"
            value={customMatchName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCustomMatchName(e.target.value)
            }
            placeholder="Enter a match name"
            required
            disabled={waiting}
          />
          <label>Match Map</label>
          <select ref={mapChoice}>
            {[...maps.keys()].map((mapName) => (
              <option value={mapName} key={mapName}>
                {mapName}
              </option>
            ))}
          </select>
          {waiting ? (
            <button
              className={lobbyStyles.disabled}
              type="submit"
              disabled={waiting}
            >
              Create custom match
            </button>
          ) : (
            <button
              className={lobbyStyles.enabled}
              type="submit"
              disabled={waiting}
            >
              Create custom match
            </button>
          )}
        </form>
      </div>
    );
  }

  function JoinQueue() {
    const joinQueue = () => {
      socket.emit("joinQueue");
    };

    const cancelQueue = () => {
      socket.emit("cancel");
    };

    return (
      <div className={lobbyStyles.joinQueue}>
        {!waiting ? (
          <>
            <label> Join matchmaking queue </label>
            <button className={lobbyStyles.confirm} onClick={joinQueue}>
              Find an opponent
            </button>
          </>
        ) : (
          <>
            <label>Waiting for opponent...</label>
            <button className={lobbyStyles.cancel} onClick={cancelQueue}>
              Cancel
            </button>
          </>
        )}
      </div>
    );
  }

  useEffect(() => {
    socket.on("gameListUpdate", (gotGamesInfo: GamesList) => {
      setGamesInfo(gotGamesInfo);
    });
    socket.emit("joinLobby");

    return () => {
      socket.off("gameListUpdate");
    };
  }, []);

  return (
    <div className={lobbyStyles.lobbyContainer}>
      <div className={lobbyStyles.createMatch}>
        <h1>Create match</h1>
        <Separator />
        <CreateGame />
      </div>
      <div className={lobbyStyles.findMatch}>
        <h1>Find match</h1>
        <Separator />
        <div className={lobbyStyles.findMatchOptions}>
          <JoinQueue />
          <GamesTable
            gamesInfo={gamesInfo}
            onJoin={(gameName) => {
              socket.emit("joinGame", gameName);
            }}
            joinEnable={!waiting}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 GamesTable                                 */
/* -------------------------------------------------------------------------- */

function GamesTable({
  gamesInfo,
  onJoin,
  joinEnable = true,
}: {
  gamesInfo: Array<GameInfo>;
  onJoin: (gameName: string) => undefined;
  joinEnable: boolean;
}) {
  const fields = new Map([
    ["Name", "name"],
    ["Host", "host"],
    ["Rating", "rating"],
    ["Type", "type"],
  ]);

  function joinButton(enabled: boolean, onClick: () => undefined) {
    return enabled ? (
      <button className={lobbyStyles.enabled} onClick={onClick}>
        Join
      </button>
    ) : (
      <button className={lobbyStyles.disabled} disabled>
        Join
      </button>
    );
  }

  function itemRow(item: GameInfo) {
    return (
      <tr key={item.id}>
        {[...fields.values()].map((key) => (
          <td key={key}>{(item as any)[key]}</td>
        ))}
        <td>
          {joinButton(joinEnable, () => {
            onJoin(item.name);
          })}
        </td>
      </tr>
    );
  }

  let fieldkeys = [...fields.keys()];
  fieldkeys.push("Join");
  let headerRow = (
    <tr>
      {fieldkeys.map((field) => (
        <th key={field}>{field}</th>
      ))}
    </tr>
  );
  let rows = gamesInfo.map((item) => itemRow(item));

  return (
    <div className={lobbyStyles.joinableGames}>
      <label>Joinable matchs</label>
      {gamesInfo.length === 0 ? (
        <>
          <p>No matchs available</p>
        </>
      ) : (
        <>
          <table>
            <thead>{headerRow}</thead>
            <tbody>{rows}</tbody>
          </table>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  PongBoard                                 */
/* -------------------------------------------------------------------------- */

function PongBoard({
  availWidth,
  availHeight,
}: {
  availWidth: number;
  availHeight: number;
}) {
  // DRAW FUNCTIONS
  function drawCountdown(
    cx: CanvasRenderingContext2D,
    seconds: number,
    { width, height }: { width: number; height: number },
    color = "#00ff80"
  ) {
    const cen = {
      x: Math.floor((width + 1) / 2),
      y: Math.floor((height + 1) / 2),
    };
    const textSize = Math.floor(height / 15);
    let saveColor = cx.fillStyle;
    cx.fillStyle = color;
    cx.textAlign = "center";
    cx.fillText(
      String(Math.ceil(seconds)),
      cen.x,
      cen.y + textSize / 2,
      textSize
    );

    const arcWidth = 10;
    const frac = seconds % 1;
    cx.beginPath();
    cx.arc(cen.x, cen.y, textSize, 0, frac * 2 * Math.PI, false);
    cx.arc(
      cen.x,
      cen.y,
      textSize + arcWidth,
      frac * 2 * Math.PI,
      2 * Math.PI,
      true
    );
    cx.fill();
    cx.fillStyle = saveColor;
  }

//   function drawGame(
//     cx: CanvasRenderingContext2D,
//     { width, height, scale }: { width: number; height: number; scale: number }
//   ) {
//     let game: any = gameRef.current; // will actually be `ClassicGame`
//     if (!game || !cx) return;
// 
//     cx.fillStyle = "black";
//     cx.fillRect(0, 0, width, height);
//     cx.fillStyle = "white"; // bluish green
//     game.update();
// 
//     // display paddles
//     let [w, h] = [gm.PONG.paddleWidth * scale, gm.PONG.paddleHeight * scale];
//     for (let { x, y } of [game.player1, game.player2]) {
//       cx.fillRect(x * scale, y * scale, w, h);
//     }
// 
//     // display ball
//     if (game.ball) {
//       let { x, y } = game.ball;
//       cx.fillRect(x * scale, y * scale, w, w);
//     } else {
//       let countdown = game.timeToBall() / 1000;
//       if (countdown > 0)
//         drawCountdown(cx, game.timeToBall() / 1000, { width, height });
//     }
// 
//     // display scores
//     let textHeight = Math.floor(height / 15);
//     cx.font = `${textHeight}px Monospace`;
//     cx.textAlign = "left";
//     cx.fillText(String(game.player1.score), 0, textHeight);
//     cx.textAlign = "right";
//     cx.fillText(String(game.player2.score), width - 1, textHeight);
//     //
//     requestAnimationFrame(() => {
//       drawGame(cx, { width, height, scale });
//     });
//   }

  function drawWallGame(
    cx: CanvasRenderingContext2D,
    { width, height }: { width: number; height: number }
  ) {
    function rtop(r: number): number {
      // real to pixel
      return Math.ceil((r / gm.WALL_PONG.width) * width);
    }

    let game: any = gameRef.current; // will actually be `WallGame`
    if (!game || !cx) return;

    game.update();

    cx.fillStyle = "black";
    cx.fillRect(0, 0, width, height);

    cx.fillStyle = "white"; // bluish green

    // display paddles
    let [w, h] = [
      rtop(gm.WALL_PONG.paddleWidth),
      rtop(gm.WALL_PONG.paddleHeight),
    ];
    for (let { x, y } of game.players) {
      [x, y] = [rtop(x), rtop(y)];
      cx.fillRect(x, y, w, h);
    }

    // display walls
    for (let { x, y, w, h } of game.walls) {
      [x, y, w, h] = [x, y, w, h].map(rtop);
      cx.fillRect(x, y, w, h);
    }

    // display scores
    let textHeight = Math.floor(height / 15);
    cx.font = `${textHeight}px Monospace`;
    cx.textAlign = "left";
    cx.fillText(String(game.scores[0]), 0, textHeight);
    cx.textAlign = "right";
    cx.fillText(String(game.scores[1]), width - 1, textHeight);
    //
    requestAnimationFrame(() => {
      drawWallGame(cx, { width, height });
    });

    // display ball
    let countdown = game.timeToBall() / 1000;
    if (countdown <= 0) {
      let { x, y } = game.ball;
      [x, y] = [rtop(x), rtop(y)];
      cx.fillRect(x, y, w, w);
    } else {
      drawCountdown(cx, game.timeToBall() / 1000, { width, height });
    }
  }

  // ACTUAL COMPONENT LOGIC
  const gameRef = useRef<gm.Game | null>(null);
  const socket = useContext(SocketContext);
  const boardRef = useRef<HTMLCanvasElement | null>(null);

  let [canvasDim, setCanvasDim] = useState<[number, number]>([
    availWidth,
    availHeight,
  ]);

  useEffect(function () {
    socket.emit(
      "syncGame",
      ({
        type,
        args,
        packet,
      }: {
        type: "classic" | "wall";
        args: any;
        packet: any;
      }) => {
        if (!gameRef.current) {
          gameRef.current = gm.makeGame({ type, args });
          gameRef.current.pushPacket(packet);

          boardRef.current?.focus();
          let cx = boardRef.current?.getContext("2d");
          if (!cx) throw new Error("Unexpected bad state");

					{
            let aspectRatio = gm.WALL_PONG.width / gm.WALL_PONG.height;
            let [width, height] = [0, 0];
            if (availWidth >= availHeight * aspectRatio)
              [width, height] = [availHeight * aspectRatio, availHeight];
            else [width, height] = [availWidth, availWidth / aspectRatio];
            setCanvasDim([width, height]);
            drawWallGame(cx, { width, height });
          }
        } else {
          gameRef.current.pushPacket(packet);
        }
      }
    );

    socket.on("gameUpdate", (packet) => {
      if (!gameRef.current) return;

      gameRef.current.pushPacket(packet);
      gameRef.current.update();
    });

    return function cleanup() {
      gameRef.current = null;
      socket.off("gameUpdate");
    };
  }, []);

  const pressed = useRef<Set<string>>(new Set());
  function dir(): gm.MotionType {
    return (
      Number(pressed.current.has("ArrowDown")) -
      Number(pressed.current.has("ArrowUp"))
    );
  }

  function handleKeyDown(ev: any) {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      if (ev.repeat) return;
      pressed.current.add(ev.key);
      socket.emit("playerMotion", dir());
    }
  }
  function handleKeyUp(ev: any) {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      pressed.current.delete(ev.key);
      socket.emit("playerMotion", dir());
    }
  }

  return (
    <div className={pongStyles.container}>
      <div className={pongStyles.gameContainer}>
        <canvas
          ref={boardRef}
          width={canvasDim[0]}
          height={canvasDim[1]}
          tabIndex={0} // apparently needed for onKey* events?
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
        >
          Cannot load pong game.
        </canvas>
      </div>
    </div>
  );
}

// function PongBox() {
// 	let box = useRef<HTMLDivElement | null>(null);
// 	let [dims, setDims] = useState<{width: number, height: number}>({width: 750, height: 500});
//
// 	useEffect( () => {
// 		addEventListener("resize", () => {
// 			if (!box.current) return;
//
// 			let newDims = { width: box.current.clientWidth, height: box.current.clientHeight};
// 			setDims( newDims );
// 			console.log(newDims);
// 		});
// 	}, []);
//
// 	return (
// 		<div ref={box} style={{width: '100%', height: '100%'}}>
// 			<PongBoard
// 				availWidth={dims.width}
// 				availHeight={dims.height}
// 			/>
// 		</div>
// 	);
// }
