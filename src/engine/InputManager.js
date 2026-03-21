export class InputManager {
    constructor(canvas, camera, engine) {
        this.canvas = canvas;
        this.camera = camera;
        this.engine = engine;

        this.mouseState = {
            isDown: false,      
            isPanning: false,   
            isEditing: false,   
            screenX: 0,         
            screenY: 0,         
            lastScreenX: 0,     
            lastScreenY: 0,     
        };

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onWheel = this.onWheel.bind(this);

        this.canvas.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    }

    onMouseDown(event) {
        if (event.button !== 0) return; 

        if (this.engine.colorPalette && this.engine.colorPalette.isOpen) {
            const isPaletteClick = this.engine.colorPalette.handleClick(event.clientX, event.clientY);
            if (isPaletteClick) return;
        }

        if (this.engine.timeControl && this.engine.uiVisible) {
            const isTimeControlClick = this.engine.timeControl.handleMouseDown(
                event.clientX, event.clientY, this.canvas.width, this.canvas.height
            );
            if (isTimeControlClick) return;
        }

        this.mouseState.isDown = true;
        this.mouseState.lastScreenX = event.clientX;
        this.mouseState.lastScreenY = event.clientY;

        if (event.shiftKey) {
            this.mouseState.isPanning = true;
        } else {
            this.mouseState.isEditing = true;
        }
    }

    onMouseUp(event) {
        if (event.button !== 0) return;

        if (this.engine.timeControl) {
            this.engine.timeControl.handleMouseUp();
        }

        this.mouseState.isDown = false;
        this.mouseState.isPanning = false;
        this.mouseState.isEditing = false;
    }

    onMouseMove(event) {
        this.mouseState.screenX = event.clientX;
        this.mouseState.screenY = event.clientY;

        if (this.engine.timeControl && this.engine.timeControl.isDraggingSlider) {
            this.engine.timeControl.handleMouseMove(
                event.clientX, event.clientY, this.canvas.width, this.canvas.height
            );
            return;
        }

        if (this.mouseState.isPanning) {
            const dx = event.clientX - this.mouseState.lastScreenX;
            const dy = event.clientY - this.mouseState.lastScreenY;
            this.camera.x += dx;
            this.camera.y += dy;
            this.mouseState.lastScreenX = event.clientX;
            this.mouseState.lastScreenY = event.clientY;
        }
    }

    onWheel(event) {
        event.preventDefault();


        const zoomDirection = event.deltaY < 0 ? 1 : -1;
        const zoomFactor = 1.1;
        
        const worldBeforeZoom = this.camera.screenToWorld(event.clientX, event.clientY);

        let newZoom = this.camera.zoom;
        if (zoomDirection > 0) {
            newZoom *= zoomFactor;
        } else {
            newZoom /= zoomFactor;
        }
        
        this.camera.zoom = Math.max(this.camera.minZoom, Math.min(newZoom, this.camera.maxZoom));
        
        const worldAfterZoom = this.camera.screenToWorld(event.clientX, event.clientY);

        this.camera.x += (worldAfterZoom.x - worldBeforeZoom.x) * this.camera.zoom;
        this.camera.y += (worldAfterZoom.y - worldBeforeZoom.y) * this.camera.zoom;
    }

    destroy() {
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('wheel', this.onWheel);
    }
}
