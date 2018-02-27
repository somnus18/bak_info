<template>
    <section class='upload-image' v-if="isNative">
        <div class="image-content" v-for="(item, index) in imgList" :key="index">
            <div class='add-current'>
                <span @click="showBigImg(item)">
                    <img :src='item.imgUrl || src' :style="[item.imgUrl ? style : '']">
                </span>
            </div>
            <p v-if='!notRemoveIcon' class="off delete" @click.stop="del(index, item)">
                <small></small>
            </p>
        </div>
        <div class="image-content" v-show="isShowAddBtn">
            <div class="add-current">
                <span  @click="isNative && uploadImage($event)">
                    <img src="./icon_addphoto@2x.png" alt="">
                </span>
                <input type='file' class='upload image' @change='uploadImage($event)'
                       accept='image/png,image/jpg,image/jpeg,image/bmp' v-if="!isNative" if multiple="multiple">
            </div>
        </div>

    </section>
</template>
<script type='text/ecmascript-6'>

    export default {
        name: 'native-upload-multiple-image-file',
        // ['mark', 'imgList', 'maxLength', 'isShowAddBtn', 'page', 'orderId', 'collateralId', 'token', 'preview', 'notRemoveIcon']
        props: {
            imgList: {
                type: Array
            },
            maxLength: {
                type: Number
            },
            isShowAddBtn: {
                type: Boolean,
                default: true
            },
            page: {
                type: String
            },
            orderId: {
                type: String
            },
            collateralId: {
                type: String
            },
            kbType: {
                type: String
            },
            token: {
                type: String
            },
            canShowBigImg: {
                type: Boolean,
                default: false
            },
            notRemoveIcon: {
                type: Boolean,
                default: false
            }
        },
        data() {
            return {
                src: require('./camera.png'),
                style: {
                    width: '100%',
                    height: '100%',
                    margin: '0'
                },
                isNative: C.Utils.App.IS_NATIVE
            };
        },
        methods: {
            uploadImage() {
                let count = this.maxLength - this.imgList.length,
                    _url, _data;
                switch (this.page) {
                    case 'applySupplyImage': // 申请材料补充影像图片上传
                        _url = C.Api('UPLOAD_APPLY_SUPPLY_IMAGE');
                        _data = {
                            kbType: this.kbType,
                            orderId: this.orderId
                        };
                        break;
                    case 'uploadMeterials': // 审核影像材料图片上传
                        _url = C.Api('UPLOAD_MATERIALS');
                        _data = {
                            kbType: this.kbType,
                            orderId: this.orderId
                        };
                        break;
                    case 'enquiry':
                        _url = C.Api('UPLOAD_ENQUIRY_IMG');
                        _data = {
                            orderId: this.orderId,
                            collateralId: this.collateralId // 询价信息录入需要该字段
                        };
                        break;
                    default:
                        _url = C.Api('UPLOAD_EVIDENCE_MATERIALS');
                        _data = {
                            orderId: this.orderId,
                            collateralId: this.collateralId // 询价信息录入需要该字段
                        };
                        break;
                }
                C.Native.uploadImage({
                    url: _url,
                    data: _data,
                    count: count > 10 ? 10 : count,
                    callback: (res)=> {
                        let images = res.data.image,
                            i,
                            len = images.length;
                        for (i = 0; i < len; i++) {
                            // this.$parent.imgList.push({
                            this.imgList.push({
                                // 以防补充材料接口出参不一致 没有bigImgUrl出参
                                bigImgUrl: C.Utils.httpAddImage(images[i].bigImgUrl || images[i].imgUrl),
                                imgUrl: C.Utils.httpAddImage(images[i].imgUrl),
                                imgId: images[i].imgId
                            });
                            if (this.imgList.length >= this.maxLength) {
                                this.$parent.isShowAddBtn = false;
                            }
                        }
                        if (parseInt(res.data.failedCount)) {
                            C.Native.tip('照片上传失败' + res.data.failedCount + '张');
                            C.debug.log('照片上传失败' + res.data.failedCount + '张', res.msg);
                        }
                    }
                });
            },
            del(index, item, callback) {
                let imgId = C.Utils.imageSpliceId(item.imgUrl);
                $.ajax({
                    url: C.Api('DELETE_IMAGE'),
                    data: {
                        imageId: imgId
                    },
                    success: (res)=> {
                        C.UI.stopLoading();
                        if (res.flag === C.Flag.SUCCESS) {
                            if (this.maxLength && this.imgList.length <= this.maxLength) {
                                if (this.$parent.imgList) {
                                    this.$parent.isShowAddBtn = true;
                                } else if (this.$parent.$parent.initImgsList) {
                                    this.$parent.$parent.isShowAddBtn = true;
                                }
                            }
                            // this.$parent.imgList是直接引用组件，例如：询价图片上传
                            // this.$parent.$parent是嵌套两层引用组件 例如:详情图片上传、材料审核，材料补充
                            if (this.$parent.imgList) {
                                this.$parent.imgList.splice(index, 1);
                            } else if (this.$parent.$parent.initImgsList) {
                                let initImgsList = this.$parent.$parent.initImgsList,
                                    forImgList,
                                    n,
                                    m;
                                initImgsListLoop: for (n = 0; n < initImgsList.length; n++) {
                                    forImgList = initImgsList[n].imgList;
                                    for (m = 0; m < forImgList.length; m++) {
                                        if (forImgList[m].imgId === item.imgId) {
                                            this.$parent.$parent.initImgsList[n].imgList.splice(m, 1);
                                            break initImgsListLoop;
                                        }
                                    }
                                }
                            }
                        }
                        callback && callback(res);
                    }
                });
            },
            showBigImg(item) {
                if (!this.canShowBigImg) return false;
                let newImgList = [],
                    imgId = item.imgId || C.Utils.imageSpliceId(item.imgUrl);
                this.imgList.forEach(element=> {
                    newImgList.push({
                        imgUrl: element.bigImgUrl || element.imgUrl, // 传入原图 而不是缩略图
                        imgId: C.Utils.imageSpliceId(element.imgUrl)
                    });
                });
                C.Native.viewImage({
                    imgId: imgId,
                    imgUrl: item.bigImgUrl || item.imgUrl, // 原图，以防无原图
                    title: C.Constant.KB_T[this.kbType],
                    imgList: newImgList,
                    deletable: 'Y',
                    delete: (res)=> {
                        let ele = res.data.item;
                        this.del(null, ele, (resp)=> {
                            C.Native.isImageDeleted({
                                imgId: ele.imgId,
                                isDeleted: resp.flag === C.Flag.SUCCESS ? 'Y' : 'N'
                            });
                        });
                    }
                });
            }
        }
    };
</script>
<style scoped lang='scss'>
    .upload-image {
        position: relative;
        display: inline-block;
        padding: .3rem;
        .image-content{
            position: relative;
            display: inline-block;
            margin: 0 .3rem .3rem 0 ;
        }
        div.add-current{
            display: inline-block;
            -webkit-box-flex: 1;
            width: 1.25rem;
            height: 1.25rem;
            margin: 0 auto;
            span {
                position: relative;
                display: table-cell;
                width: 1.25rem;
                height: 1.25rem;
                text-align: center;
                vertical-align: middle;
                img {
                    display: -webkit-box;
                    width: 1.25rem;
                    height: 1.25rem;
                    margin: auto;
                }
            }
        }

        .off {
            position: absolute;
            right: -.25rem;
            top: -.2rem;
            width: .6rem;
            height: .6rem;
            line-height: .6rem;
            z-index: 10;
            text-align: center;
            small {
                display: inline-block;
                width: .36rem;
                height: .36rem;
                background: url(./icon_deletephoto@2x.png) no-repeat;
                background-size: 100%;
            }
        }

        .image {
            width: 1.25rem;
            height: 1.25rem;
        }

        .upload {
            position: absolute;
            top: 0;
            left: 0;
            opacity: 0;
        }

    }
</style>
