<template>
    <section class='upload-image' v-if="!isNative">
        <div class="image-content" v-for="(item, index) in imgList">
            <div class='add-current'>
                <span @click='previewImage'>
                    <img :src='item.imgUrl || src' :style="[item.imgUrl ? style : '']">
                </span>
            </div>
            <p class="off delete" v-if='!notRemoveIcon' @click.stop="del(index, item)">
                <small></small>
            </p>
        </div>
        <div class="image-content" v-show="isShowAddBtn">
            <div class="add-current">
                <span>
                    <img src="./icon_addphoto@2x.png" alt="">
                </span>
                <input type='file' class='upload image' @change='uploadImage($event)'
                       accept='image/png,image/jpg,image/jpeg,image/bmp' multiple="multiple">
            </div>
        </div>

    </section>
</template>
<script type='text/ecmascript-6'>
    import file from './index';

    export default {
        name: 'h5-upload-multiple-image-file',
        /**
         * 当uploadType上传类型
         *      submit,表示与提交或保存接口一起上传。
         *      其他类型选中图片立即上传
         */
        props: {
            mark: {
                default: ''
            },
            imgList: {
                type: Array
            },
            maxLength: {
                type: [String, Number],
                default: 20
            },
            isShowAddBtn: {
                type: Boolean,
                default: true
            },
            notRemoveIcon: {
                type: Boolean,
                default: false
            },
            uploadType: {
                type: String
            },
            itemIndex: { // 若是上传图片功能是多个(数组)
                type: Object
            },
            preview: { // 是否可以点击预览
                type: Boolean, // true可以预览  false不可以预览
                default: false
            },
            orderId: {
                type: String
            },
            kbType: {
                type: String
            },
            page: {
                type: String
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
        created() {
        },
        mounted() {
            this.count = 0;
        },
        computed: {},
        methods: {
            previewImage() {
                if (this.preview) {
                    C.Native.tip('调用Native-previewImage方法');
                }
            },
            uploadImage(e) {
                file.readMultipleFile(e.target, null, (imgBase64, index, total, fileName)=> {
                    if (!imgBase64) {
                        C.UI.stopLoading();
                        return;
                    }
                    this.count ++;
                    if (this.uploadType !== 'submit') {
                        // 清除input.value 保证change事件执行
                        if (total === this.count) {
                            this.count = 0;
                            e.target.value = '';
                        }
                        let formData = new FormData(), _url, _data;
                        switch (this.page) {
                            case 'pending': // 详情图片上传
                                _url = C.Api('UPLOAD_MATERIALS');
                                break;
                            case 'applySupplyImage': // 申请材料补充影像图片上传
                                _url = C.Api('UPLOAD_APPLY_SUPPLY_IMAGE');
                                break;
                            case 'uploadMeterials': // 审核影像材料图片上传
                                _url = C.Api('UPLOAD_MATERIALS');
                                break;
                        }
                        C.debug.log(index, total, fileName);
                        _data = {
                            kbType: this.kbType,
                            orderId: this.orderId
                        };
                        formData.append('imageFile', file.formDataImage(imgBase64), fileName);
                        formData.append('data', JSON.stringify(_data));
                        $.ajax({
                            url: _url,
                            data: formData,
                            processData: false,
                            contentType: false,
                            cache: false,
                            beforeSend: ()=> {
                            },
                            success: (res)=> {
                                C.UI.stopLoading();
                                if (res.flag === C.Flag.SUCCESS) {
                                    // 嵌套两层组件
                                    let imgList = this.$parent.$parent.initImgsList;
                                    imgList.forEach(item=> {
                                        if (item.kbType === this.kbType) {
                                            item.imgList.push({
                                                imgId: res.data.imgId,
                                                imgUrl: C.Utils.httpAddImage(res.data.imgUrl),
                                                bigImgUrl: C.Utils.httpAddImage(res.data.bigImgUrl || res.data.imgUrl) // 以防补充材料接口出参不一致 没有bigImgUrl出参
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                }, this.imgList.length, this.maxLength);
            },
            del(index, item) {
                $.ajax({
                    url: C.Api('DELETE_IMAGE'),
                    data: {
                        imageId: C.Utils.imageSpliceId(item.imgUrl)
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
                                let initImgsList = this.$parent.$parent.initImgsList, forImgList, n, m;
                                for (n = 0; n < initImgsList.length; n++) {
                                    forImgList = initImgsList[n].imgList;
                                    for (m = 0; m < forImgList.length; m++) {
                                        if (forImgList[m].imgId === item.imgId) {
                                            this.$parent.$parent.initImgsList[n].imgList.splice(m, 1);
                                            return false;
                                        }
                                    }
                                }
                            }
                        }
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
