<template>
    <section class="upload-ocr">
        <span class="ocr" @click="isShowOcrDialog = !isShowOcrDialog"></span>
        <div v-show="isShowOcrDialog" class="ocr-dialog-container layer">
            <div class="content">
                <div class="close" @click="isShowOcrDialog = false"></div>
                <div class="btn btn-white positive">
                    身份证正面
                    <input type="file" class="upload ocr" @change="uploadOcr($event, '01')"
                           accept="image/png,image/jpg,image/jpeg,image/bmp">
                </div>
                <div class="btn btn-white negative">
                    身份证反面
                    <input type="file" class="upload ocr" @change="uploadOcr($event, '02')"
                           accept="image/png,image/jpg,image/jpeg,image/bmp">
                </div>
            </div>
        </div>
    </section>
</template>
<script type="text/ecmascript-6">
    import file from './index';

    export default {
        name: 'upload-ocr',
        props: {
            mark: {
                type: String,
                default: ''
            },
            objName: {
                type: String,
                default: ''
            },
            index: {
                type: [String, Number],
                default: ''
            }
        },
        data() {
            return {
                isShowOcrDialog: false
            };
        },
        created() {
        },
        mounted() {
        },
        computed: {},
        methods: {
            /**
             * ocr上传
             * @param e
             * @param type 01为正面,02为反面
             */
            uploadOcr(e, type) {
                file.readFile(e.target, null, (imgBase64)=> {
                    C.UI.loading();
                    C.debug.log('uploadOcr', 'type值为' + type + (type === '01' ? '正面' : '反面'), '图片名称: ' + e.target.files[0].name);
                    this.$emit('uploadOcr' + this.mark, {
                        imgBase64: imgBase64,
                        imgName: e.target.files[0].name,
                        type: type,
                        objName: this.objName,
                        index: this.index
                    });
                    // 每次取消已选择的图片后，将input[type='file']的value值重置为空。修复同一图片不能连续上传问题
                    e.target.value = '';
                    this.isShowOcrDialog = false;
                });
            }
        }
    };
</script>
<style scoped lang="scss">
    .upload-ocr {
        position: relative;
        display: inline-block;
        .ocr {
            display: inline-block;
            width: .6rem;
            height: .52rem;
            background: url('./icon_camera@2x.png') center no-repeat;
            background-size: .52rem;
        }
        .ocr-dialog-container{
            z-index: 999;
            .close{
                position: absolute;
                top: -30%;
                left: 50%;
                width: .5rem;
                height: .5rem;
                margin-left: -.25rem;
                background: url('../../assets/images/m/icons/icon_closepopup@2x.png');
                background-size: 100%;
            }
            .content {
                position: absolute;
                width: 84%;
                height: auto;
                top: 50%;
                left: 50%;
                margin-top: -2.3rem;
                margin-left: -42%;
                text-align: center;
                background-color: white;
                border: 1px solid #fff;
                border-radius: .05rem;
                .btn{
                    width: 60%;
                    height: .76rem;
                    line-height: .76rem;
                    border-radius: .38rem;
                    font-size: .36rem;
                    margin: 0 auto;
                    &.positive{
                         margin-top: .8rem;
                     }
                    &.negative{
                         margin-top: .6rem;
                         margin-bottom: .8rem;
                     }
                }
                .upload {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                }
            }
        }
    }
</style>
