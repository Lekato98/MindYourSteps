import { _decorator, AudioSource, CCInteger, Component, instantiate, Label, Node, Prefab, Vec3 } from 'cc';
import { PlayerController } from './PlayerController';

const {ccclass, property} = _decorator;

enum BlockType {
    BT_NONE,
    BT_STONE,
}

enum GameState {
    GS_INIT,
    GS_PLAYING,
    GS_END,
}

@ccclass('GameManager')
export class GameManager extends Component {
    @property({type: Prefab})
    public cubePrefab: Prefab | null = null;
    @property({type: CCInteger})
    public roadLength: Number = 50;
    @property({type: Node})
    public startMenu: Node | null = null;
    @property({type: PlayerController})
    public playerCtrl: PlayerController | null = null;
    @property({type: Label})
    public stepsLabel: Label | null = null;
    @property(AudioSource)
    public backgroundAudio: AudioSource | null = null;

    private _road: number[] = [];
    private _curState: GameState = GameState.GS_INIT;
    private _backgroundAudioInterval: number;
    private _backgroundAudioTimeout: number;

    start(): void {
        this.curState = GameState.GS_INIT;
        this.playerCtrl.node.on('JumpEnd', this.onPlayerJumpEnd, this);
        this.startBackgroundAudio();
    }

    init() {
        if (this.startMenu) {
            this.startMenu.active = true;
        }

        this.generateRoad();

        if (this.playerCtrl) {
            this.playerCtrl.setInputActive(false);
            this.playerCtrl.node.setPosition(Vec3.ZERO);
            this.playerCtrl.reset();
        }
    }

    set curState(value: GameState) {
        switch (value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING:
                if (this.startMenu) {
                    this.startMenu.active = false;
                }

                if (this.stepsLabel) {
                    //  reset the number of steps to 0
                    this.stepsLabel.string = 'Steps: 0';
                }
                // set active directly to start listening for mouse events directly
                setTimeout(() => {
                    if (this.playerCtrl) {
                        this.playerCtrl.setInputActive(true);
                    }
                }, 0.1);
                break;
            case GameState.GS_END:
                break;
        }
        this._curState = value;
    }

    generateRoad() {

        this.node.removeAllChildren();

        this._road = [];
        // startPos
        this._road.push(BlockType.BT_STONE);

        for (let i = 1; i < this.roadLength; i++) {
            if (this._road[i - 1] === BlockType.BT_NONE) {
                this._road.push(BlockType.BT_STONE);
            } else {
                this._road.push(Math.floor(Math.random() * 2));
            }
        }

        for (let j = 0; j < this._road.length; j++) {
            let block: Node | null = this.spawnBlockByType(this._road[j]);
            if (block) {
                this.node.addChild(block);
                block.setPosition(j, -1.5, 0);
            }
        }
    }

    spawnBlockByType(type: BlockType) {
        if (!this.cubePrefab) {
            return null;
        }

        let block: Node | null = null;
        switch (type) {
            case BlockType.BT_STONE:
                block = instantiate(this.cubePrefab);
                break;
        }

        return block;
    }

    onStartButtonClicked() {
        this.stopBackgroundAudio();
        this.playerCtrl.onFall.stop();
        this.curState = GameState.GS_PLAYING;
    }

    startBackgroundAudio(): void {
        this.backgroundAudio.play();
        this._backgroundAudioInterval = setInterval(() => this.backgroundAudio.play(), 5000);
    }

    stopBackgroundAudio(): void {
        clearInterval(this._backgroundAudioInterval);
        clearTimeout(this._backgroundAudioTimeout);
        this.backgroundAudio.stop();
    }

    checkResult(moveIndex: number) {
        if (moveIndex <= this.roadLength) {
            if (this._road[moveIndex] == BlockType.BT_NONE) {
                // ump to the empty square
                this.curState = GameState.GS_INIT;
                this.playerCtrl.onFall.play();
                this._backgroundAudioTimeout = setTimeout(() => this.startBackgroundAudio(), 2000);
            }
        } else {
            // skipped the maximum length
            this.curState = GameState.GS_INIT;
        }
    }

    onPlayerJumpEnd(moveIndex: number) {
        if (this.stepsLabel) {
            this.stepsLabel.string = `Steps: ${ moveIndex }`;
        }
        this.checkResult(moveIndex);
    }

    // update (deltaTime: number) {
    //     // Your update function goes here.
    // }
}
