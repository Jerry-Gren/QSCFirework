var canvas = document.getElementById("ClockCanvas");

var ctx = canvas.getContext('2d');

canvas.width = 550;
canvas.height = 800;




// 绘制插销
var bolt = new Image();
bolt.src = 'src/Bolt.png';
bolt.onload = function() {
    var bolt_x = (canvas.width - bolt.width) / 2;
    var bolt_y = canvas.height / 8;
    ctx.drawImage(bolt, bolt_x, bolt_y, bolt.width, bolt.height);
}

// 绘制表盘
var clockboard = new Image();
clockboard.src = 'src/ClockBoard.png';
clockboard.onload = function() {
    var clockboard_x = (canvas.width - clockboard.width) / 2;
    var clockboard_y = canvas.height / 2;
    ctx.drawImage(clockboard, clockboard_x, clockboard_y, clockboard.width, clockboard.height);
}

// 绘制时针
var hourhand = new Image();
hourhand.src = 'src/HourHand.png';
hourhand.onload = function() {
    // y_offset用于校正时针与表盘无法对齐的问题
    houry_offset = 20;
    var hourhand_x = (canvas.width - hourhand.width) / 2;
    var hourhand_y = (canvas.height + clockboard.height) / 2 - hourhand.height + houry_offset;
    ctx.drawImage(hourhand, hourhand_x, hourhand_y, hourhand.width, hourhand.height);
}

// 绘制分针
var minutehand = new Image();
minutehand.src = 'src/MinuteHand.png';
minutehand.onload = function() {
    // y_offset用于校正分针与表盘无法对齐的问题
    miny_offset = 20;
    var minutehand_x = (canvas.width - minutehand.width) / 2;
    var minutehand_y = (canvas.height + clockboard.height) / 2 - minutehand.height + miny_offset;
    ctx.drawImage(minutehand, minutehand_x, minutehand_y, minutehand.width, minutehand.height);
}




// 根据时间计算分针和时针的角度
function angle_calc() {
    var time_str = getTime();
    var hour_str = time_str.slice(0, 2);
    var minute_str = time_str.slice(3, 5);
    var minute_angle = minute_str / 60 * 360;
    var hour_angle = hour_str / 12 * 360 + minute_str / 2;
    var angles = new Array(minute_angle * Math.PI / 180, hour_angle * Math.PI / 180);
    return angles;
}

// 另外写了一个绘图函数，因为原来的drawImage太难用了QwQ
function angle_adjust(target, ed, center_x, center_y, offset) {
    // ctx.save();
    ctx.translate(center_x, center_y);
    ctx.rotate(ed);
    ctx.drawImage(target, -(target.width / 2), -target.height + offset, target.width, target.height);
    ctx.rotate(-ed);
    ctx.translate(-center_x, -center_y);
    // ctx.restore();
}




// end用于记录分针和时针的目标角度，先分针，后时针
var end = [0, 0];

/*
鼠标点击检测
版权：北极熊Leo
*/
const statusConfig = {
    IDLE: 0,
    DRAG_START: 1, 
    DRAGGING: 2
}

const canvasInfo = {
    status: statusConfig.IDLE,
    dragTarget: null,
    lastEvtPos: {x: null, y: null}
}

const target = [];

// 若不进行此处赋值，可能产生未知的错误，即bolt.width的值0
bolt_width = bolt.width;
// 将要移动的目标bolt添加到列表target中
target.push({
    name: 'bolt',
    x: (canvas.width - bolt_width) / 2,
    y: canvas.height / 8,
    offset_y: 0,
    status: 'unlock'
})

// 获取鼠标当前在画布的位置
const getCanvasPosition = e => {
    return {
        x: e.offsetX,
        y: e.offsetY
    }
}

// 计算直线距离
const getDistance = (a, b) => {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

// 当鼠标按下
canvas.addEventListener('mousedown', e => {
    const canvasPosition = getCanvasPosition(e);
    console.log("[Collision Detect]: mousePos: ", canvasPosition);

    // 表盘的半径
    r = clockboard.width / 2;

    // 判断鼠标坐标是否在插销的矩形内且不在表盘内，如果是，就
    if ((canvas.width - bolt.width) / 2 < canvasPosition.x && canvasPosition.x < (canvas.width + bolt.width) / 2
    && target[0].y < canvasPosition.y && canvasPosition.y < target[0].y + bolt.height && getDistance(canvasPosition, {x: centerx, y: centery}) > r) {
        console.log("[Collision Detect]: Bolt.");
        canvasInfo.dragTarget = target[0];
        canvasInfo.status = statusConfig.DRAG_START;
        canvasInfo.lastEvtPos = canvasPosition;
    }

    centerx = canvas.width / 2;
    centery = (canvas.height + clockboard.height) / 2;

    /*
    如果鼠标点击在表盘内，并且时间停止，就计算该点与中心所成的角度
    省略了 canvasPosition.x = centerx 的情况
    target[0].y === 310 代替 getIsTimePassing() 用于判断时间是否停止
    因为后者在刚开始可能引起逻辑错误
    */
    if (getDistance(canvasPosition, {x: centerx, y: centery}) < r && target[0].y === 310) {
        console.log("[Collision Detect]: ClockBoard.");
        k = (canvasPosition.y - centery) / (canvasPosition.x - centerx);
        radian = Math.atan(k);
        angle = 180 / Math.PI * radian;
        if (canvasPosition.x > centerx) {
            angle = 90 + angle;
        }
        if (canvasPosition.x < centerx) {
            angle = 270 + angle;
        }

        // 根据角度计算时间，并调整
        time_1 = angle / 30;
        time_2 = time_1 + 12;
        console.log("[Time Admin]: time_1: ", time_1);
        console.log("[Time Admin]: time_2: ", time_2);
        nowtime = getTime().slice(0, 2) / 1 + getTime().slice(3, 5) / 60;
        console.log("[Time Admin]: nowtime:", nowtime);
        if (time_1 < nowtime && time_2 < nowtime) {
            target_time = time_1;
        }
        if (time_1 < nowtime && time_2 > nowtime) {
            target_time = time_2;
        }
        if (time_1 > nowtime && time_2 > nowtime) {
            target_time = time_1;
        }
        console.log("[Time Admin]: target_time: ", target_time);
        hh = Math.trunc(target_time);
        mm = Math.trunc((target_time - hh) * 60);
        // console.log("hh:", hh);
        // console.log("mm:", mm);
        setTime(hh + ":" + mm);
        console.log("[Time Admin]: timeChange Success.");
        
        // 在调整时间时播放声音
        let mp3 = new Audio('src/tick3.mp3');
        mp3.play();
    }
})

// 鼠标移动时
canvas.addEventListener('mousemove', e => {
    // 获取鼠标坐标
    const canvasPosition = getCanvasPosition(e);

    // 表盘的半径
    r = clockboard.width / 2;

    // 判断鼠标坐标是否在插销的矩形内且不在表盘内，如果是，就修改鼠标指针样式为grab，否则改回
    if ((canvas.width - bolt.width) / 2 < canvasPosition.x && canvasPosition.x < (canvas.width + bolt.width) / 2
    && target[0].y < canvasPosition.y && canvasPosition.y < target[0].y + bolt.height && getDistance(canvasPosition, {x: centerx, y: centery}) > r) {
        canvas.style.cursor = 'grab';
    } else {
        canvas.style.cursor = '';
    }
    if (canvasInfo.status === statusConfig.DRAG_START && getDistance(canvasPosition, canvasInfo.lastEvtPos) > 5) {
        console.log('[Drag Control]: try to drag.');
        canvasInfo.status = statusConfig.DRAGGING;
        target[0].status = 'lock';
    } else if (canvasInfo.status === statusConfig.DRAGGING) {
        console.log('[Drag Control]: dragging.');
        const { dragTarget } = canvasInfo;
        // dragTarget.x = canvasPosition.x;
        if (dragTarget.status === 'lock') {
            dragTarget.offset_y = canvasPosition.y - dragTarget.y;
            dragTarget.status = 'unlock';
        }
        dragTarget.y = canvasPosition.y - dragTarget.offset_y;
        console.log("[Drag Control]: dragTarget: ", dragTarget);
        // 将移动范围限制的相关代码写在此处，而不是setInterval内，是为了防止其闪烁
        if (dragTarget.y <= 100) {
            dragTarget.y = 100;
        }
        if (dragTarget.y >= 310) {
            dragTarget.y = 310;
            freezeTime();
            console.log("[Time Admin]: Time Stop.");
        } else {
            meltTime();
            console.log("[Time Admin]: Time Continue.");
        }
    }
})

// 鼠标松开时
canvas.addEventListener('mouseup', e => {
    if (canvasInfo.status === statusConfig.DRAGGING) {
        console.log('[Drag Control]: drag end.');
    }
    canvasInfo.status = statusConfig.IDLE;
})




// 时钟，启动！
setInterval(function() {

    centerx = canvas.width / 2;
    centery = (canvas.height + clockboard.height) / 2;
    
    // 刷新画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    end = angle_calc();

    // 标注插销为可交互内容
    if (getTime().slice(0, 2) % 2 === 0 && getIsTimePassing() === true) {
        ctx.strokeStyle = 'red';
    } else {
        ctx.strokeStyle = 'green';
    }
    // 根据文档说的，beginPath 和 closePath 防止“意想之外的结果”
    ctx.beginPath();
    ctx.moveTo((canvas.width - bolt.width) / 2, target[0].y);
    ctx.lineTo((canvas.width - bolt.width) / 2, target[0].y + bolt.height);
    ctx.lineTo((canvas.width + bolt.width) / 2, target[0].y + bolt.height);
    ctx.lineTo((canvas.width + bolt.width) / 2, target[0].y);
    ctx.lineTo((canvas.width - bolt.width) / 2, target[0].y);
    ctx.closePath();
    ctx.stroke();


    // 标注表盘为可交互内容
    if (target[0].y === 310) {
        ctx.strokeStyle = 'green';
    } else {
        ctx.strokeStyle = 'red';
    }
    ctx.beginPath();
    ctx.arc(centerx, centery, clockboard.height / 2 + 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    // 重新绘制插销
    // 废弃代码 (centery - clockboard.height / 2) / 4 + bolt.height
    angle_adjust(bolt, 0, centerx, target[0].y + 200, 0);
    // 重新绘制表盘
    angle_adjust(clockboard, 0, centerx, centery + clockboard.height / 2, 0);
    // 调整时针角度
    angle_adjust(hourhand, end[1], centerx, centery, 20);
    // 调整分针角度
    angle_adjust(minutehand, end[0], centerx, centery, 20);
    ctx.closePath();

    ctx.beginPath();
    ctx.translate(0, 0);
    ctx.font = "20px Arial";
    ctx.fillStyle = 'white';
    ctx.fillText("TIME", 10, 120);
    ctx.fillText(getTime(), 70, 120);
    ctx.font = "15px Arial";
    ctx.fillText("Glittering R&G - Movable", 10, 150);
    ctx.fillText("All G - Tap to adjust time", 10, 170);
    ctx.closePath();
}, 15);

// 走时时播放声音
setInterval(function() {
    if (getIsTimePassing() === true) {
        let mp3 = new Audio('src/tick3.mp3');
        mp3.play();
    }
}, 200);