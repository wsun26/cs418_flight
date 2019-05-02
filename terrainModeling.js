/**
 * Creates a "class" for the terrain with the correct dimensions
 * source: http://www.playfuljs.com/realistic-terrain-in-130-lines/
 *          editted to work in javascript
 */
function terrain(detail){
  this.size = Math.pow(2, detail)+1; 
  this.max = this.size-1; 
  this.map = new Float32Array(this.size*this.size); 
  this.getpos = position; 
  this.map.set([this.max/2], this.getpos(0, 0)); 
  this.map.set([this.max/2], this.getpos(this.max, 0)); 
  this.map.set([this.max/2], this.getpos(this.max, this.max)); 
  this.map.set([this.max/2], this.getpos(0, this.max));   
  divide(this.max, this);
}

/**
 * Returns the position of (x, y) in 1D row major format
 */
function position(x, y){
  if(x < 0 || y < 0 || x > this.max || y > this.max) {return 0; }
  return x+y*this.size; 
}

/**
 * Returns the average of input a, b, c, and d
 */
function average(a, b, c, d){
    return (a+b+c+d)/4; 
}

/**
 * Recursive function for the diamond square algorithm 
 */
function divide(size, self) {
  var x, y, half = size / 2;
  var scale = 6 * size;
  if (half < 1) return;
  
  // Nested for loop for recursive call of square portion of algorithm
  for (y = half; y < self.max; y += size) {
    for (x = half; x < self.max; x += size) {
      square(x, y, half, Math.random() * scale * 2 - scale, self);
    }
  }

  // Nested for loop for recursive call of diamond portion of algorithm
  for (y = 0; y <= self.max; y += half) {
    for (x = (y + half) % size; x <= self.max; x += size) {
      diamond(x, y, half, Math.random() * scale * 2 - scale, self);
    }
  }
  divide(size / 2, self);
}

/**
 * Diamond algorithm, takes the average of the four square corners and returns an average+random offset
 */
function diamond(x, y, size, offset, self) {
    var ave = average(
    self.map[self.getpos(x, y-size)],      // top
    self.map[self.getpos(x+size, y)],      // right
    self.map[self.getpos(x, y+size)],      // bottom
    self.map[self.getpos(x-size, y)]       // left
  );
  self.map.set([ave+offset], self.getpos(x, y));
    
}

/**
 * Square algorithm, takes the average of the four diamond corners and returns the average+random offset
 */
function square(x, y, size, offset, self) {
  var avg = average(
    self.map[self.getpos(x - size, y - size)],   // upper left
    self.map[self.getpos(x + size, y - size)],   // upper right
    self.map[self.getpos(x + size, y + size)],   // lower right
    self.map[self.getpos(x - size, y + size)]    // lower left
  );

  self.map.set([avg + offset], self.getpos(x, y));
}

/**
 * Returns the maximum value of the terrain height map
 */
terrain.prototype.mapmax = function(){
    var max=-Infinity, len = this.map.length-1;
    for (var i = 0 ; i < len; i++ )
      if ( this.map[i] > max ) max = this.map[i];
    return max;
};

/**
 * Returns the minimum value of the terrain height map
 */
terrain.prototype.mapmin = function(){
    var min=Infinity, len = this.map.length-1;
    for (var i = len ; i > -1; i-- )
      if ( this.map[i] < min ) min = this.map[i];
    return min;
};

/**
 * Returns a normalized 0 to 1 height map array given a terrain height map
 */
terrain.prototype.normalize = function(){
    var denom = this.mapmax()-this.mapmin(); 
    var num_min = this.mapmin(); 
    for (var i = 0 ; i < this.map.length; i++ )
        this.map[i] = (this.map[i]-num_min)/denom; 
};

/**
 * Returns a vertexArray, normalArray initialized to 0, 
 */
function terrainFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray,normalArray, heightArray)
{
    var deltaX=(maxX-minX)/n;
    var deltaY=(maxY-minY)/n;
    for(var i=0;i<=n;i++)
       for(var j=0;j<=n;j++)
       {
           vertexArray.push(minX+deltaX*j);
           vertexArray.push(minY+deltaY*i);
           vertexArray.push(heightArray.map[heightArray.getpos(j, i)]);
           
           normalArray.push(0);
           normalArray.push(0);
           normalArray.push(0);
       }

    var numT=0;
    for(var i=0;i<n;i++)
       for(var j=0;j<n;j++)
       {
           var vid = i*(n+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+1);
           faceArray.push(vid+n+1);
           
           faceArray.push(vid+1);
           faceArray.push(vid+1+n+1);
           faceArray.push(vid+n+1);
           numT+=2;
       }
    return numT;
}; 

/**
 * Returns the normals for all vertices in the form of a normalArray
 * source: https://courses.engr.illinois.edu/cs418/fa2017/discussion_content_Spring2017/discussion.html
 */
function setNorms(faceArray, vertexArray, normalArray)
{
    for(var i=0; i<faceArray.length;i+=3)
    {
        //find the face normal, mutiple by 3 since there are 3 components per vertex, add because x, y, z, 0, 1, 2, 3, 4, 5, 6, 7, 8
        var vertex1 = vec3.fromValues(vertexArray[faceArray[i]*3],vertexArray[faceArray[i]*3+1],vertexArray[faceArray[i]*3+2]);

        var vertex2 = vec3.fromValues(vertexArray[faceArray[i+1]*3],vertexArray[faceArray[i+1]*3+1],vertexArray[faceArray[i+1]*3+2]);

        var vertex3 = vec3.fromValues(vertexArray[faceArray[i+2]*3],vertexArray[faceArray[i+2]*3+1],vertexArray[faceArray[i+2]*3+2]);

        var vect31=vec3.create(), vect21=vec3.create();
        vec3.sub(vect21,vertex2,vertex1);
        vec3.sub(vect31,vertex3,vertex1)
        var v=vec3.create();
        vec3.cross(v,vect21,vect31);

        //add the face normal to all the faces vertices
        normalArray[faceArray[i]*3  ]+=v[0];
        normalArray[faceArray[i]*3+1]+=v[1];
        normalArray[faceArray[i]*3+2]+=v[2];

        normalArray[faceArray[i+1]*3]+=v[0];
        normalArray[faceArray[i+1]*3+1]+=v[1];
        normalArray[faceArray[i+1]*3+2]+=v[2];

        normalArray[faceArray[i+2]*3]+=v[0];
        normalArray[faceArray[i+2]*3+1]+=v[1];
        normalArray[faceArray[i+2]*3+2]+=v[2];

    }

    //normalize each vertex normal
    for(var i=0; i<normalArray.length;i+=3)
    {
        var v = vec3.fromValues(normalArray[i],normalArray[i+1],normalArray[i+2]);
        vec3.normalize(v,v);

        normalArray[i  ]=v[0];
        normalArray[i+1]=v[1];
        normalArray[i+2]=v[2];
    }

    console.log("normalArray elements: ", normalArray);
    console.log("faceArray elements: ", faceArray.length);

    //return the vertex normal
    return normalArray;
}

/**
 * Returns an array of lines
 */
function generateLinesFromIndexedTriangles(faceArray,lineArray)
{
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);

        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);

        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}
