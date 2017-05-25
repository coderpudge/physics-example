
var smooth = require('smooth');

cc.Class({
    extends: cc.Component,

    properties: {
        // 粒子数量
        particleNumber: 12,
        // 粒子半径
        particleRadius: 30,
        // 球形面积
        sphereSize: 12
    },

    // use this for initialization
    init: function () {
        //绘制图形
        this.ctx = this.getComponent(cc.Graphics);
        // 当前线条宽度
        this.ctx.lineWidth = 6;
        // 线段颜色
        this.ctx.strokeColor = cc.hexToColor('#495069');
        // 填充颜色
        this.ctx.fillColor = cc.hexToColor('#ffde59');

        let x = this.node.x;
        let y = this.node.y;

        let particleNumber = this.particleNumber;
        let particleRadius = this.particleRadius;
        let sphereSize = this.sphereSize;
        // 粒子角度 = 2 π / 粒子数
        let particleAngle = (2*Math.PI)/particleNumber;
        let particleDistance = Math.sin(particleAngle) * particleRadius * Math.sin((Math.PI - particleAngle)/2);

        let spheres = [];
        spheres.push( this._createSphere(0, 0, sphereSize, this.node) );

        for (let i=0; i<particleNumber; i++) {
            let angle = particleAngle*i;
            let posX = particleRadius * Math.cos(angle);
            let posY = particleRadius * Math.sin(angle);
            let sphere = this._createSphere(posX, posY, sphereSize);
            spheres.push( sphere );
            
            let joint = sphere.node.addComponent(cc.DistanceJoint);
            // 关节另一端链接的刚体
            joint.connectedBody = spheres[0];
            // 关节两端距离
            joint.distance = particleRadius;
            // 减震比
            joint.dampingRatio = 0.5;
            // 弹性系数
            joint.frequency = 4;

            if (i > 0) {
                joint = sphere.node.addComponent(cc.DistanceJoint);
                joint.connectedBody = spheres[spheres.length - 2];
                joint.distance = particleDistance;
                joint.dampingRatio = 1;
                joint.frequency = 0;
            }

            if (i === particleNumber - 1) {
                joint = spheres[1].node.addComponent(cc.DistanceJoint);
                joint.connectedBody = sphere;
                joint.distance = particleDistance;
                joint.dampingRatio = 1;
                joint.frequency = 0;
            }

            sphere.node.parent = this.node;
        }

        this.spheres = spheres;
    },

    _createSphere (x, y, r, node) {
        if (!node) {
            node = new cc.Node();
            node.x = x;
            node.y = y;
        }

        let body = node.addComponent(cc.RigidBody);
        // 圆形物理碰撞体
        let collider = node.addComponent(cc.PhysicsCircleCollider);
        // 密度
        collider.density = 1;
        // 弹性系数，取值一般在 [0, 1]之间
        collider.restitution = 0.4;
        // 摩擦系数，取值一般在 [0, 1] 之间
        collider.friction = 0.5;
        // 半径
        collider.radius = r;

        return body;
    },

    emitTo (target) {
        var x = target.x;
        var y = target.y;

        var selfX = this.node.x;
        var selfY = this.node.y;

        //求距离 pDistance
        var distance = Math.sqrt((x-selfX)*(x-selfX) + (y-selfY)*(y-selfY));
        var distance2 = cc.pDistance(cc.v2(x,y),cc.v2(selfX,selfY));
        cc.log("distance",distance,distance2);

        // 求向量减法 pSub
        var velocity = cc.v2(x-selfX, y-selfY);
        var velocity2 = cc.pSub(cc.v2(x,y),cc.v2(selfX,selfY));
        cc.log("velocity",velocity,velocity2);
        // 向量标准化长度为1   v2.normalizeSelf
        velocity.normalizeSelf();
        // 向量缩放    放大到距离的两倍 
        velocity.mulSelf(distance*2);

        this.spheres.forEach(function (sphere) {
            // 刚体在世界坐标下的线性速度
            sphere.linearVelocity = velocity;
        });
    },

    update (dt) {
        var ctx = this.ctx;

        var points = this.spheres.map(sphere => {
            return this.expandPosition( sphere.node.position );
        });

        points.shift();

        var result = smooth( points );
        var firstControlPoints = result[0];
        var secondControlPoints = result[1];

        var pos = points[0];
        //清除之前绘制的所有内容
        ctx.clear();
        ctx.moveTo(pos.x, pos.y);

        for (var i = 1, len = points.length; i < len; i++) {
            var firstControlPoint = firstControlPoints[i - 1],
                secondControlPoint = secondControlPoints[i - 1];
                // 绘制三次贝赛尔曲线路径
            ctx.bezierCurveTo(
                firstControlPoint.x, firstControlPoint.y,
                secondControlPoint.x, secondControlPoint.y,
                points[i].x, points[i].y
            );
        }
        //将笔点返回到当前路径起始点的。它尝试从当前点到起始点绘制一条直线。
        ctx.close();
        // 根据当前的画线样式，填充当前或已经存在的路径
        ctx.fill();
        // 根据当前的画线样式，绘制当前或已经存在的路径。
        ctx.stroke();
    },
    // 放大向量
    expandPosition (pos) {
        return pos.mul(1.3);
    }
});
