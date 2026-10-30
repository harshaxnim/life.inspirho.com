var c = document.getElementById('c');
var ctx = c.getContext('2d');
var cdata = ctx.getImageData(0, 0, c.width, c.height);

var scene = {};

// TODO
scene.camera = {
	point: {
		x: 0,
		y: 0,
		z: 10
	},
	fieldOfView: 45,
	vector: {
		x: 0,
		y: 3,
		z: 0
	}
};

scene.orthoCamera = {
	pos: {
		x: 0,
		y: 0,
		z: 5
	},
	lookAt: {
		x: 0,
		y: 0,
		z: 0
	},
	aperture: {
		d: 8
	},
	up: {
		x: 0,
		y: 1,
		z: 0
	}
};

scene.lights = [
  {
	pos: {
		x: 0,
		y: 0,
		z: 6
	},
	color: {
		x: 50,
		y: 50,
		z: 50
	}
  }
];

scene.objects = [
	{
		type: 'bg',
		color: {
			x: 30,
			y: 30,
			z: 30
		}
	},
	{
		type: 'sphere',
		point: {
			x: 0,
			y: 0,
			z: 0
		},
		color: {
			x: 200,
			y: 200,
			z: 200
		},
		specular: 1,
		lambert: 0.7,
		ambient: 0.1,
		radius: 2
	},
	{
		type: 'sphere',
		point: {
			x: 0,
			y: 0,
			z: 0
		},
		color: {
			x: 200,
			y: 80,
			z: 80
		},
		specular: .2,
		lambert: 0.7,
		ambient: 0.1,
		radius: .5
	},
	{
		type: 'sphere',
		point: {
			x: 0,
			y: 0,
			z: 0
		},
		color: {
			x: 80,
			y: 200,
			z: 80
		},
		specular: .2,
		lambert: 0.7,
		ambient: 0.1,
		radius: .5
	},
	{
		type: 'sphere',
		point: {
			x: 0,
			y: 0,
			z: 0
		},
		color: {
			x: 80,
			y: 80,
			z: 200
		},
		specular: .2,
		lambert: 0.7,
		ambient: 0.1,
		radius: .5
	},
];

function detectRaySphereCollision(ray, sphere) {
	// ray base to sphere center vector. call it e2c
	var e2c = vector.sub(sphere.point, ray.baseVec);

	// square of dot of e2c with the ray dir (unit) vector
	var adj = vector.dot(e2c, ray.dirVec), adj2 = adj*adj;

	// dot of e2c to e2c
	var hyp2 = vector.dot(e2c, e2c);

	// we now have two terms of the pythogoras thorem for the triangle made up by the ray, e2c and perpendicular from center to ray
	// find the other side using the pythogoras
	var opp2 = hyp2 - adj2;

	// find the seg len, helps in finding the distance of cam to collision
	var d2 = (sphere.radius*sphere.radius) - opp2;

	// length of this side decides of the ray hit the sphere
	k = adj - Math.sqrt(d2);
	if (d2 > 0 && k > 0) { // collision
		return k;
	}

	return;
}

function detectRayCollision(ray, objects) {
	var hit = {status: false, object: scene.objects[0], distance: Infinity};
	for (var i in objects) {
		var object = objects[i];
		var dist = Infinity;
		switch (object.type) {
			case "sphere":
				dist = detectRaySphereCollision(ray, object);
				break;
		}
		var validHit = dist > 0.0001;
		if (dist !== undefined && dist < hit.distance && validHit) {
			hit = {status: true, object: object, distance: dist};
		}
	}
	return hit;
}

function random(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function hashCode(inp){
    var hash = 0;
    var len = inp.length;
//     debugger;
    for (var i = 0; i < inp.length; i++) {
        var axis = inp[i];
        hash = ((hash<<5)-hash)+axis;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

function sphereNormal(sphere, point) {
    var	normal = vector.unit(vector.sub(point, sphere.point));
    var nseed = hashCode(normal);
    // var nseed = normal.x * normal.y * normal.z + normal.x + normal.y + normal.z;
    var rs = .05;
	return vector.add(normal, vector.vec(random(nseed)*rs, random(nseed)*rs, random(nseed)*rs));
}

function lineOfSight(scene, point, lightPos) { // TODO
	var connectingRay = {};
	connectingRay.baseVec = point;
	connectingRay.dirVec = vector.unit(vector.sub(lightPos, point));
	var los = detectRayCollision(connectingRay, scene.objects).status;
	return !los; // no collision = lineOfSight
}

function reflectVector(dirVec, normal) {
	var d = vector.scale(normal, vector.dot(dirVec, normal));
	return vector.sub(dirVec, vector.scale(d, 2));
};

function surfaceColor(scene, object, ray, hitPoint, traceRecursionDepth, normal) {
	var finalColor = vector.vec(0,0,0);

	// calculate ambient shading
	if (object.ambient) {
		finalColor = vector.add(finalColor, vector.scale(object.color, object.ambient));
	}

	// calculate lambert shading
	if (object.lambert) {
		for (i in scene.lights) {
			var light = scene.lights[i];
			if(!lineOfSight(scene, hitPoint, light.pos)) continue;

			var outColor = vector.vec(Math.sqrt(object.color.x*light.color.x), Math.sqrt(object.color.y*light.color.y), Math.sqrt(object.color.z*light.color.z));
			var illuminance = Math.max(0, vector.dot(normal, vector.unit(vector.sub(light.pos, hitPoint))));

			outColor = vector.scale(outColor, object.lambert);
			outColor = vector.scale(outColor, illuminance);

			finalColor = vector.add(finalColor, outColor);
		}
	}
	

	// calculate specular shading
	if (object.specular) {
		var reflectedRay = {
			baseVec: hitPoint,
			dirVec: reflectVector(ray.dirVec, normal)
		}
		var outColor = trace(reflectedRay, scene, ++traceRecursionDepth);
		if (outColor) {
			outColor = vector.scale(outColor, object.specular);
			finalColor = vector.add(finalColor, outColor);
		}

	}

	return finalColor;
}

function trace(ray, scene, recursionDepth) {

	if (recursionDepth > 1) return;

	// what does the ray hit?
	var hit = detectRayCollision(ray, scene.objects);

	// get the color of the ray's pixel
	if (hit.status) {
		var hitPoint = vector.add(ray.baseVec, vector.scale(ray.dirVec, hit.distance));
		var normal = sphereNormal(hit.object, hitPoint);
		return surfaceColor(scene, hit.object, ray, hitPoint, recursionDepth, normal);
	}
	return hit.object.color;
}

var frameSpeed = 16.6666666667;
var smoothness = .3;
var electronTimer = 1;
var camTimer = 1;

window.addEventListener("keydown", dealWithKeyboard, false);

function dealWithKeyboard(e) {
	var step = 0.1;
	switch(e.keyCode) {
		case 37:
			// left key pressed
			scene.objects[1].point.x -= step;
			// camTimer -= 1;
			break;
		case 38:
			// up key pressed
			scene.objects[1].point.y += step;
			break;
		case 39:
			// right key pressed
			scene.objects[1].point.x += step;
			// camTimer += 1;
			break;
		case 40:
			// down key pressed
			scene.objects[1].point.y -= step;
			break;
		case 65:
			// a is pressed
			myTimer -= 1;
			camTimer -= 1;
			break;
		case 68:
			// d is pressed
			myTimer += 1;
			camTimer += 1;
			break;
	}
}

function render(scene) {

	ctx.clearRect(0, 0, c.width, c.height);
	
	var phase = 0;
	scene.objects[2].point.x = 3*Math.cos(phase	+ electronTimer*0.1*smoothness);
	scene.objects[2].point.y = 3*Math.sin(phase	+ electronTimer*0.1*smoothness);
	scene.objects[2].point.z = 3*Math.cos(phase	+ electronTimer*0.1*smoothness);

	phase = (Math.PI*2/3);
	scene.objects[3].point.x = -3*Math.sin(phase + electronTimer*0.1*smoothness);
	scene.objects[3].point.y =  3*Math.sin(phase + electronTimer*0.1*smoothness);
	scene.objects[3].point.z =  3*Math.cos(phase + electronTimer*0.1*smoothness);

	phase = (Math.PI*4/3);
	scene.objects[4].point.x = 3*Math.sin(phase	+ electronTimer*0.1*smoothness);
	scene.objects[4].point.y = 3*Math.sin(phase	+ electronTimer*0.1*smoothness);
	scene.objects[4].point.z = 3*Math.cos(phase	+ electronTimer*0.1*smoothness);
	
	electronTimer += 1;
	
	var camera = scene.orthoCamera,
		objects = scene.objects,
		lights = scene.lights,
		vw = c.width,
		vh = c.height,
		midw = vw/2,
		midh = vh/2;
	
	var ray = {}
	ray.dirVec = vector.unit(vector.sub(camera.lookAt, camera.pos));
	var camRight = vector.unit(vector.cross(ray.dirVec, camera.up));
	var camUp = vector.unit(vector.cross(camRight, ray.dirVec));
	var pixelWidth = camera.aperture.d/vw;
	var pixelHeight = camera.aperture.d/vh;
	
	var imageSparsity = 1;
	for (var i=0; i<vw; i+=imageSparsity) {
		for (var j=0; j<vh; j+=imageSparsity) {
			ray.baseVec = vector.add(camera.pos, vector.scale(camRight, (i-midw)*pixelWidth), vector.scale(camUp, (midh-j)*pixelHeight));

			pixelColor = trace(ray, scene, 0);
			
			pixelIndex = 4*((i)+(j*vw));
			
			cdata.data[pixelIndex+0] = Math.abs(pixelColor.x);
			cdata.data[pixelIndex+1] = Math.abs(pixelColor.y);
			cdata.data[pixelIndex+2] = Math.abs(pixelColor.z);
			cdata.data[pixelIndex+3] = 255;

		}
	}
	
	ctx.putImageData(cdata, 0, 0);
	setTimeout(render, frameSpeed, scene);
}


setTimeout(render, frameSpeed, scene);
