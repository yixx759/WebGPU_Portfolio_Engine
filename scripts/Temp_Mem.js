const MAX_MEMORY = 32;

const MAX_MEMORY_div_3 = Math.ceil(32  / 3);

const temp_memory = new Float32Array(MAX_MEMORY);
let mem_index = 0;
const vector_view = new Array(MAX_MEMORY_div_3);
let vec_index = 0;

for (let  i = 0; i < MAX_MEMORY_div_3; i++)
{
    vector_view[i] = temp_memory.subarray(i * 3, i * 3 + 3);
}

function get_vector_index(value_index)
{
    return Math.ceil(value_index / 3);
}

export function set_temp_memory(value, size)
{
    if (size < 1)
    {
        console.log("SIZE IS TOO SMALL TMP MEM");
    }

    if (size >= MAX_MEMORY)
    {
        console.log("SIZE IS TOO BIG TMP MEM");
    }

    if ( mem_index + size >= MAX_MEMORY)
    {
        console.log("TEMP OVERLOAD USING TOO MUCH");
    }

    if (size == 1)
    {
        temp_memory[mem_index++] = value;
        
        vec_index = get_vector_index(mem_index);
        return mem_index - 1;
    }
    else
    {
        temp_memory[mem_index++] = value;

        for (let i = 0; i < size; i++)
        {
            temp_memory[mem_index++] = value[i];
        }
        
        vec_index = get_vector_index(mem_index);
        return mem_index - size;
    }
}

export function set_temp_memory_vector(x, y, z)
{
    if (mem_index + 3 >= MAX_MEMORY)
    {
        console.log("TEMP OVERLOAD USING TOO MUCH");
    }

    const tmp_arr = vector_view[vec_index++];

    tmp_arr[0] = x;
    tmp_arr[1] = y;
    tmp_arr[2] = z;

    mem_index = vec_index * 3;

    return vec_index - 1;
    
}

export function get_new_temp_memory_vector_array()
{
    if (mem_index + 3 >= MAX_MEMORY)
    {
        console.log("TEMP OVERLOAD USING TOO MUCH");
    }

    const tmp_arr = vector_view[vec_index++];

    mem_index = vec_index * 3;

    return tmp_arr;
}

export function get_temp_memory_value(index)
{
    if (index < 0)
    {
        console.log("SIZE IS TOO SMALL GET TMP MEM VALUE");
    }

    if (index >= MAX_MEMORY)
    {
        console.log("SIZE IS TOO BIG GET TMP MEM VALUE");
    }

    return temp_memory[index];
}

export function get_temp_memory_vector()
{

    if (mem_index + 3 >= MAX_MEMORY_div_3)
    {
        console.log("SIZE IS TOO BIG GET TMP MEM VEC");
    }

    mem_index = (vec_index + 1) * 3;

    return vector_view[vec_index++];
}

export function clear_temp_mem()
{
    mem_index = 0;
}