import {absVectorSubtract, vectorAdd} from "./helperFuncs.js";

export function makeColliderFromVerts(vertexs)
{
    let maxVals = new Float32Array([0, 0, 0]);
    // Multi thread me
    for (let i = 0; i < vertexs.length; i+= 8)
    {
        maxVals[0] = Math.max(Math.abs(vertexs[i]), maxVals[0])
        maxVals[1] = Math.max(Math.abs(vertexs[i+1]), maxVals[1])
        maxVals[2] = Math.max(Math.abs(vertexs[i+2]), maxVals[2])
    }
  
    return new Float32Array([Math.abs(maxVals[0]), Math.abs(maxVals[1]), Math.abs(maxVals[2]), 0]);
}

export function AABB(positionA, halfA, positionB, halfB) {
    const diff = absVectorSubtract(positionA, positionB);
    const totalHalfs = vectorAdd(halfA, halfB);

    return (diff[0] <= totalHalfs[0]) && (diff[1] <= totalHalfs[1]) && (diff[2] <= totalHalfs[2])
}

/* Ray structure

* Ray Info *
  vector3    origin
  vector3    direction
  vector3    inverseDirection = 1/direction

*/

const ORIGIN_X_INDEX = 0;
const ORIGIN_Y_INDEX = 1;
const ORIGIN_Z_INDEX = 2;

const DIR_X_INDEX = 3;
const DIR_Y_INDEX = 4;
const DIR_Z_INDEX = 5;

const INV_DIR_X_INDEX = 6;
const INV_DIR_Y_INDEX = 7;
const INV_DIR_Z_INDEX = 8;

export class ray
{
    rayInfo = new Float32Array(9);

    constructor(origin_x, origin_y, origin_z, dir_x, dir_y, dir_z)
    {
        this.rayInfo[ORIGIN_X_INDEX] = origin_x;
        this.rayInfo[ORIGIN_Y_INDEX] = origin_y;
        this.rayInfo[ORIGIN_Z_INDEX] = origin_z;

        this.rayInfo[DIR_X_INDEX] = dir_x;
        this.rayInfo[DIR_Y_INDEX] = dir_y;
        this.rayInfo[DIR_Z_INDEX] = dir_z;

        this.rayInfo[INV_DIR_X_INDEX] = 1.0 / dir_x;
        this.rayInfo[INV_DIR_Y_INDEX] = 1.0 / dir_y;
        this.rayInfo[INV_DIR_Z_INDEX] = 1.0 / dir_z;
    }

    get_ray_origin(x_y_or_z)
    {
        if (x_y_or_z < 0 || x_y_or_z > 2) {
        console.log("ERROR: ray subscript wrong");
        return -1;
      }

        return this.rayInfo[ORIGIN_X_INDEX + x_y_or_z];
    }

    get_ray_dir(x_y_or_z)
    {
        if (x_y_or_z < 0 || x_y_or_z > 2) {
        console.log("ERROR: ray subscript wrong");
        return -1;
      }

        return this.rayInfo[DIR_X_INDEX + x_y_or_z];
    }

    get_ray_inv_dir(x_y_or_z)
    {
        if (x_y_or_z < 0 || x_y_or_z > 2) {
        console.log("ERROR: ray subscript wrong");
        return -1;
      }

        return this.rayInfo[INV_DIR_X_INDEX + x_y_or_z];
    }

    get_ray_dest()
    {
        return new Float32Array([this.rayInfo[ORIGIN_X_INDEX] +  this.rayInfo[DIR_X_INDEX], 
            this.rayInfo[ORIGIN_Y_INDEX] +  this.rayInfo[DIR_Y_INDEX],
            this.rayInfo[ORIGIN_Z_INDEX] +  this.rayInfo[DIR_Z_INDEX]])
    }
}

const DIMENSIONS_FOR_AABB = 3;

// Can be improved https://tavianator.com/2022/ray_box_boundary.html
// TO DO: to get real distance from T direction in ray has to be normalize. restruct to dir mag.

export function ray_AABB_intersection(ray, min, max)
{
    if (!(min instanceof Float32Array)) {
    console.log("ERROR: min in ray aabb intersect wasnt given float32array");
        return -1;
    }

    if (!(max instanceof Float32Array)) {
    console.log("ERROR:  max in ray aabb intersect wasnt given float32array");
        return -1;
    }

    let t_min = 0;
    let t_max = Infinity;

    // TO DO: Optimize look at orignal paper casey had combine with the stack of ors???
    // TO DO: Or could use output T to filter???

    let dest = ray.get_ray_dest();
    for (let i = 0; i < DIMENSIONS_FOR_AABB; i++)
    {
        if ((ray.get_ray_origin(i) < min[i] && dest[i] < min[i]) || (ray.get_ray_origin(i) > max[i] && dest[i] > max[i]) )
        {
            return false;
        }
    }

    for (let i = 0; i < DIMENSIONS_FOR_AABB; i++)
    {
        let t1 = (min[i] - ray.get_ray_origin(i)) * ray.get_ray_inv_dir(i);
        let t2 = (max[i] - ray.get_ray_origin(i)) * ray.get_ray_inv_dir(i);

        t_min = Math.max(t_min, Math.min(t1, t2));
        t_max = Math.min(t_max, Math.max(t1, t2));
    }

    return t_min < t_max;
}