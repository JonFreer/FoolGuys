import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { World } from "./World/World";
import { Vector2 } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GUI } from "dat.gui";
import { MessageType } from "backend";

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("three/examples/jsm/libs/draco");
gltfLoader.setDRACOLoader(dracoLoader);

loadGLTF("assets/character.glb", (gltf) => {
  world.loadCharacter(gltf);
});

let titleScreen = true;

var hostname = location.hostname;
let socket: WebSocket;

if (hostname != "localhost") {
  socket = new WebSocket("wss://" + hostname + "/ws");
} else {
  socket = new WebSocket("ws://" + hostname + ":2865");

  const gui = new GUI();
  var object4 = {
    GetDebugState: function () {
      socket.send(JSON.stringify(["get_debug", {}]));
    },
  };

  var object5 = {
    GetNavMesh: function () {
      socket.send(JSON.stringify(["get_nav_mesh", {}]));
    },
  };

  const debugFolder = gui.addFolder("Debug");
  gui.add(object4, "GetDebugState");
  gui.add(object5, "GetNavMesh");
  debugFolder.open();
}

const world = new World(socket, "assets/world.glb");

socket.onmessage = function (event) {
  const msg = JSON.parse(event.data) as MessageType;
  // console.log(msg)
  if (msg.kind == "Join") {
    world.player_id = msg.id;
  }

  if (msg.kind == "WorldUpdate") {
    const data = msg;

    // console.log("World Update", data);
    world.playerManager.updatePlayers(data.players);
    world.inputManager.setRadius(
      data.players[world.player_id].camera_distance - 0.1
    );
    world.objectManager.updateObstacles(data.dynamic_objects);
    world.vehicles.updateVehicles(data.vehicles);
  }

  if (msg.kind == "Chat") {
    world.chatManager.newMessage(
      msg.name.slice(1, -1),
      msg.message.slice(1, -1)
    );
  }

  if (msg.kind == "PhysicsUpdate") {
    world.debug.update_state(msg.data);
  }

  if (msg.kind == "PhysicsState") {
    world.debug.load_state(msg.data);
  }

  if (msg.kind == "NavMesh") {
    world.navMesh.load_nav_mesh(msg.data)
  }
};

document.addEventListener("keydown", onDocumentKey, false);
document.addEventListener("keyup", onDocumentKey, false);

let join_button = document.getElementById("join");
if (join_button) {
  join_button.onclick = join;
}
// document.querySelector("#join")?.addEventListener("click", async function (){
//     // await world.renderer.domElement.requestFullscreen({ navigationUI: 'hide' })
//     // screen.orientation.lock('landscape')
// })

function join() {
  //get the name inputed
  let name_input = document.getElementById(
    "settings_input"
  ) as HTMLInputElement;
  if (name_input) {
    socket.send(JSON.stringify(["name", name_input.value]));
  }
  titleScreen = false;
  let settings_holder = document.getElementById(
    "settings_holder"
  ) as HTMLDivElement;
  if (settings_holder) {
    settings_holder.style.display = "none";
  }
  // document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => { screen.orientation.lock('landscape') })
  world.mobileControls.enable();

  let throw_button = document.getElementById("button_throw") as HTMLDivElement;
  if (throw_button) {
    throw_button.onclick = () => {
      socket.send(JSON.stringify(["throw", {}]));
    };
  }
}

const keyMap: { [id: string]: boolean } = {};

world.animate();

function onDocumentKey(e: KeyboardEvent) {
  keyMap[e.key.toLowerCase()] = e.type === "keydown";
  if (e.key === "Tab") {
    world.labels.setEnabled(e.type === "keydown");
    e.preventDefault();
  }
}

// function sendUpdate(movement: THREE.Vector2) {
//   if (!titleScreen) {
//     socket.send(
//       JSON.stringify([
//         "update",
//         {
//           t: Date.now(),
//           moveVector: movement,
//           keyMap: keyMap,
//           viewVector: world.inputManager.characterReceiver.viewVector,
//         },
//       ])
//     );
//   }
// }

function loadGLTF(path: string, onLoadingFinished: (gltf: any) => void): void {
  // let trackerEntry = this.addLoadingEntry(path);

  gltfLoader.load(
    path,
    (gltf) => {
      onLoadingFinished(gltf);
      // this.doneLoading(trackerEntry);
    },
    (xhr) => {
      if (xhr.lengthComputable) {
        // trackerEntry.progress = xhr.loaded / xhr.total;
      }
    },
    (error) => {
      console.error(error);
    }
  );
}
