// USED WITH PROMISES 

const asyncHandler =(requestHandler) => {
    (req,res,next)=> {
        Promise.resolve(requestHandler(req,res,next))
        .catch((err) => next(err))
    }
}


export{asyncHandler}





//------------------TRY-CATCH METHOD------------
/*

const asyncHandler = (fn) =>  async(req , res , next) => {
    try {
        await fn(req,res,next)

    } catch (error) {
        res.error(err.code || 500).json({
            success : false,
            message: err.message
            // for froentnd
        })
        
    }
}
 */
