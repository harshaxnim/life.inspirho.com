vector = {}

vector.vec = function(a, b, c) {
	return {x: a, y: b, z: c};
}

vector.string = function(vec) {
	return vec.x+", "+vec.y+", "+vec.z;
}

vector.length = function(vec) {
	return Math.sqrt(vector.dot(vec, vec));
}

vector.unit = function(vec) {
	return vector.scale(vec, 1 / vector.length(vec));
}

vector.add = function() {
	retVec = {x:0, y:0, z:0};
	for (var i=0; i<arguments.length; i+=1) {
		retVec.x += arguments[i].x;
		retVec.y += arguments[i].y;
		retVec.z += arguments[i].z;
	}
	return retVec;
}

vector.sub = function(vec1, vec2) {
  retVec = {x:0, y:0, z:0};
  retVec.x = vec1.x - vec2.x;
  retVec.y = vec1.y - vec2.y;
  retVec.z = vec1.z - vec2.z;
  return retVec;
}


vector.scale = function(vec, scale) {
	return {x:scale*vec.x, y:scale*vec.y, z:scale*vec.z};
}

vector.dot = function(vec1, vec2) {
  return (vec1.x * vec2.x) + (vec1.y * vec2.y) + (vec1.z * vec2.z);
}

vector.cross = function(vec1, vec2) {
	return {
        x: (vec1.y * vec2.z) - (vec1.z * vec2.y),
        y: (vec1.z * vec2.x) - (vec1.x * vec2.z),
        z: (vec1.x * vec2.y) - (vec1.y * vec2.x)
    };
}
