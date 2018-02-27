/**
 * Created by xiaochaofeng090 on 17/9/21.
 * description 读取并压缩图片,可以单独引用。
 * 引入方式:
 *  import file from 'src/components/upload/index';
 *  file.readFile(e.target, null, (bae64Img)=> {
 *      // 返回base64图片
 *  });
 */

let tip = function (content) {
        C.UI.warn({
            title: '提示',
            content: content || '该浏览器不支持图片上传,请更换浏览器。',
            okText: '确认'
        });
    },
    // 压缩比例
    getQuality = (size)=> {
        // 默认不需要压缩
        let quality = false;
        if (size > 100) {
            if (size < 500 && size > 100) {
                quality = 0.8;
            } else if (size < 1000 && size > 500) {
                quality = 0.7;
            } else if (size < 2000 && size > 1000) {
                quality = 0.5;
            } else if (size < 5000 && size > 2000) {
                quality = 0.3;
            } else {
                quality = 0.2;
            }
        }
        return quality;
    },
    // 压缩文件
    compress = (img, obj = {}, callback, index, total, fileName)=> {
        let that = img,
            base64Img,
            w = that.width,
            h = that.height,
            imgSize = parseInt(img.src.length / 1024),
            scale = w / h,
            quality,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            anw,
            anh,
            maxW,
            repeatQuality;
        try {
            // 创建属性节点
            anw = document.createAttribute('width');
            anh = document.createAttribute('height');
            // 设置with最大值;否则则为最大值它
            maxW = 3000;
            w = obj.width || w;
            h = obj.height || (w / scale);
            if (parseInt(w) > maxW) {
                w = maxW;
                h = parseInt(1 / scale * maxW);
            }
            anw.nodeValue = w;
            anh.nodeValue = h;
            canvas.setAttributeNode(anw);
            canvas.setAttributeNode(anh);
            // IE有时会报错try{}catch捕获
            ctx.drawImage(that, 0, 0, w, h);

            quality = obj.quality = getQuality(imgSize);
            base64Img = quality ? canvas.toDataURL('image/jpeg', quality) : img.src;
            // 兼容iphone5s canvas.toDataURL为data:,的问题 iphone5s不能压缩
            // 打印图片数据长度
            C.debug.log('压缩比例: ' + quality);
            C.debug.log('原图图片长度: ' + imgSize + 'KB');
            C.debug.log('base64图片长度: ' + base64Img.length / 1024 + 'KB');
            if (base64Img.length > 50) {
                repeatQuality = 0.2;
                while (base64Img.length / 1024 > 1500 || repeatQuality <= 0.025) {
                    repeatQuality -= 0.025;
                    base64Img = canvas.toDataURL('image/jpeg', repeatQuality);
                    C.debug.log('再次压缩base64图片长度: ' + base64Img.length / 1024 + 'KB');
                }
            } else {
                C.debug.log('图片压缩后数据:' + base64Img.length);
                base64Img = img.src;
                C.debug.log('图片不能压缩,图片原长度为:' + base64Img.length);
            }
            callback && callback(base64Img, index, total, fileName);
        } catch (err) {
            C.UI.stopLoading();
            tip('图片上传中出现未知错误, 请重新上传或使用其他浏览器(更换设备)上传');
        }
    },
    /**
     * 读取图片
     * @param file 图片文件
     * @param opt 设置读取后的图片参数
     * @param callback 回调
     */
    fileReader = (file, opt, callback, index, total)=> {
        let reader = null,
            img = null;
        reader = new FileReader();
        reader.onload = function () {
            img = new Image();
            if (!reader.result) {
                C.UI.stopLoading();
                tip();
                return;
            }
            img.onload = function () {
                let nameType = file.type.split('/')[1];
                compress(img, opt = {}, callback, index, total, file.name || (Date.now() + '.' + nameType));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    };

export default {
    /**
     * 读取第一张图片数据
     * @param input input元素对象
     * @param opt
     *   {
     *     width: '200', // 设置压缩图片的宽
     *     height: '200', // 设置压缩图片的高
     *     quality: '0.8' // 设置图片压缩的质量
     *   }
     * @param callback 回调返回图片base64
     */
    readFile(input, opt = {}, callback) {
        let file = null;
        C.UI.loading();
        if (input.files) {
            file = input.files[0];
            if (!file) {
                C.UI.stopLoading();
                tip();
                return;
            }
            fileReader(file, opt, callback);
        } else {
            C.UI.stopLoading();
            tip();
        }
    },
    /**
     * 读取多张图片数据
     * @param input input元素对象
     * @param opt
     *   {
     *     width: '200', // 设置压缩图片的宽
     *     height: '200', // 设置压缩图片的高
     *     quality: '0.8' // 设置图片压缩的质量
     *   }
     * @param callback 回调返回图片base64
     */
    readMultipleFile(input, opt = {}, callback, curLen, maxLen) {
        let file = null,
            i = 0,
            uploadLen,
            filesLen,
            minLen;
        C.UI.loading();
        if (input.files) {
            uploadLen = maxLen - curLen > 10 ? 10 : maxLen - curLen;
            filesLen = input.files.length > 10 ? 10 : input.files.length;
            if (input.files.length > uploadLen) {
                C.Native.tip('最多只能选择' + uploadLen + '张图片，更多图片请分批上传');
            }
            minLen = Math.min(uploadLen, filesLen);
            C.debug.log('minLen:' + minLen, 'uploadLen:' + uploadLen, 'filesLen:' + filesLen);
            for (i = 0; i < minLen; i++) {
                file = input.files[i];
                if (!file) {
                    C.UI.stopLoading();
                    tip();
                    break;
                }
                if (file.type === 'image/gif') {
                    C.UI.stopLoading();
                    C.Native.tip('上传的图片中gif图片, 不支持gif动图上传');
                    continue;
                }
                if (file.size <= 0) {
                    C.UI.stopLoading();
                    C.Native.tip('上传的图片中有无效或已损坏图片, 请核实!');
                    continue;
                }
                C.UI.loading();
                fileReader(file, opt, callback, i, minLen);
            }
        } else {
            C.UI.stopLoading();
            tip();
        }
    },
    /**
     * base64图片压缩
     */
    compress(imgBase64, callback) {
        let img = new Image();
        img.src = imgBase64;
        compress(img, {}, callback);
    },
    // base64转成FormData
    formDataImage(base64Data) {
        let format = 'image/jpeg',
            base64 = base64Data,
            code = window.atob(base64.split(',')[1]),
            aBuffer = new window.ArrayBuffer(code.length),
            uBuffer = new window.Uint8Array(aBuffer),
            blob = null, bb;
        for (let i = 0; i < code.length; i++) {
            uBuffer[i] = code.charCodeAt(i) & 0xff;
        }
        try {
            blob = new Blob([uBuffer], {type: format});
        } catch (e) {
            window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
            if (e.name === 'TypeError' && window.BlobBuilder) {
                bb = new window.BlobBuilder();
                bb.append(uBuffer.buffer);
                blob = bb.getBlob('image/jpeg');
            } else if (e.name === 'InvalidStateError') {
                blob = new Blob([aBuffer], {type: format});
            } else {
                tip();
            }
        }
        return blob;
    }
};
