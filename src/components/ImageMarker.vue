<template>
  <div class="container">
    <!-- 左侧区域：图片显示和操作区域 -->
    <div class="left">
      <!-- 图片显示区域：使用Canvas绘制图片和标记 -->
      <div ref="wrapper" class="left-top">
        <!-- Canvas元素：用于绘制图片和矩形标记
             Canvas是HTML5提供的绘图API，可以实时绘制图形、图像
             这里我们使用它来显示图片并在上面绘制矩形标记框 -->
        <canvas ref="canvas"
                @mousedown="handleMouseDown"
                @mousemove="handleMouseMove"
                @mouseup="handleMouseUp"/>
      </div>
      <!-- 工具栏：提供各种操作按钮 -->
      <div class="left-bottom">
        <!-- 上一张图片按钮 -->
        <el-tooltip effect="light" content="上一张" placement="top">
          <el-button circle type="warning" @click="handleImageSwitch(currentImageIndex - 1)">
            <i class="el-icon-caret-left"/>
          </el-button>
        </el-tooltip>
        <!-- 新建标记按钮：点击后进入绘制模式 -->
        <el-tooltip effect="light" content="新建标记" placement="top">
          <el-button circle type="primary" @click="creating = !creating" :disabled="creating">
            <i class="el-icon-crop"/>
          </el-button>
        </el-tooltip>
        <!-- 保存标记按钮：将当前标记保存到本地存储 -->
        <el-tooltip effect="light" content="保存标记" placement="top">
          <el-button circle type="success" @click="handleSaveLabel">
            <i class="el-icon-folder"/>
          </el-button>
        </el-tooltip>
        <!-- 删除标记按钮：删除选中的标记 -->
        <el-tooltip effect="light" content="删除标记" placement="top">
          <el-button circle type="danger" @click="handleDeleteLabel" :disabled="selectedRectIndex === -1">
            <i class="el-icon-delete"/>
          </el-button>
        </el-tooltip>
        <!-- 显示当前缩放比例 -->
        <el-tag type="plain" style="margin: 0 10px">
          缩放率: {{ (Math.round(scale * 100) / 100).toFixed(2) }}
        </el-tag>
        <!-- 放大按钮：增加缩放比例 -->
        <el-tooltip effect="light" content="放大" placement="top">
          <el-button circle type="primary" @click="zoom(scale + scaleStep)" :disabled="this.scale >= this.maxScale">
            <i class="el-icon-zoom-in"/>
          </el-button>
        </el-tooltip>
        <!-- 缩小按钮：减少缩放比例 -->
        <el-tooltip effect="light" content="缩小" placement="top">
          <el-button circle type="primary" @click="zoom(scale - scaleStep)" :disabled="this.scale <= this.minScale">
            <i class="el-icon-zoom-out"/>
          </el-button>
        </el-tooltip>
        <!-- 自适应按钮：将图片缩放到适合窗口大小 -->
        <el-tooltip effect="light" content="自适应" placement="top">
          <el-button circle type="primary" @click="zoom(adaptiveScale)">
            <i class="el-icon-full-screen"/>
          </el-button>
        </el-tooltip>
        <!-- 下一张图片按钮 -->
        <el-tooltip effect="light" content="下一张" placement="top">
          <el-button circle type="warning" @click="handleImageSwitch(currentImageIndex + 1)">
            <i class="el-icon-caret-right"/>
          </el-button>
        </el-tooltip>
      </div>
    </div>
    <!-- 右侧信息展示栏：显示标签列表和图片列表 -->
    <div class="right">
      <!-- 标签列表卡片：显示当前图片的所有标记 -->
      <el-card class="label-list">
        <div slot="header">
          <span style="font-size: 16px; font-weight: bold;">标签列表</span>
        </div>
        <!-- 使用表格显示标记列表 -->
        <el-table
            fit
            :show-header="false"
            :data="rects"
            :cell-class-name="rectCellClass"
            @cell-click="rectCellClick"
            style="width: 100%">
          <el-table-column
              prop="name"
              label="标签名"
              width="200">
          </el-table-column>
          <el-table-column
              label="操作"
              width="40">
            <template slot-scope="scope">
              <!-- 删除按钮：删除对应的标记 -->
              <el-button type="text"
                         size="small"
                         class="el-icon-delete"
                         @click="handleDeleteLabel(scope.row)"/>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      <!-- 图片列表卡片：显示所有可用的图片 -->
      <el-card class="image-list">
        <div slot="header">
          <span style="font-size: 16px; font-weight: bold;">图片列表</span>
        </div>
        <!-- 使用表格显示图片列表 -->
        <el-table
            fit
            :show-header="false"
            :data="images"
            :cell-class-name="imageCellClass"
            @cell-click="imageCellClick"
            style="width: 100%">
          <el-table-column
              show-overflow-tooltip
              prop="url"
              label="图片路径"
              width="240">
          </el-table-column>
        </el-table>
      </el-card>
      <!-- 显示鼠标当前位置坐标 -->
      <span>位置 x: {{ currentX }}, y: {{ currentY }}</span>
    </div>
    <!-- 标签命名弹窗：为新建的标记输入名称 -->
    <el-dialog width="17vw"
               title="标签命名"
               :modal="false"
               :before-close="handleCancelInput"
               :close-on-click-modal="false"
               :visible.sync="showNameInput">
      <el-form ref="tag">
        <el-form-item>
          <!-- 标签名输入框：支持输入新标签或选择已有标签 -->
          <el-select
              v-model="labelName"
              filterable
              allow-create
              clearable
              default-first-option
              placeholder="请输入或选择已有标签名">
            <el-option
                v-for="(item, i) in uniqueName"
                :key="i"
                :label="item"
                :value="item">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button size="mini" @click="handleInputLabel" type="primary">确认</el-button>
          <el-button size="mini" @click="handleCancelInput">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
    <!-- 提示保存弹窗：切换图片时提示是否保存当前修改 -->
    <el-dialog width="15vw"
               title="是否保存改动？"
               :modal="false"
               :close-on-click-modal="false"
               :visible.sync="showSaveAlert">
      <el-form ref="tag">
        <el-form-item>
          <el-button size="mini" type="success" @click="handleSaveChange(true)">是</el-button>
          <el-button size="mini" type="warning" @click="handleSaveChange(false)">否</el-button>
          <el-button size="mini" type="default" @click="showSaveAlert = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import Rect from '@/models/Rect'; // 导入矩形类，用于创建和管理矩形标记

export default {
  name: "ImageMarker",
  data() {
    return {
      /* 图片相关数据 */
      images: [
        {
          id: 1,
          url: require('@/assets/cat.jpg'), // 使用require加载图片资源
        },
        {
          id: 2,
          url: require('@/assets/bay.jpg'),
        },
      ],
      /* 状态变量：控制组件的行为 */
      creating: false,        // 是否处于创建标记模式
      canvasChanged: false,   // 画布是否发生变化（用于判断是否需要保存）
      showNameInput: false,   // 是否显示标签命名弹窗
      showSaveAlert: false,   // 是否显示保存提示弹窗

      /* 缩放相关变量 */
      dpr: 1,                // 设备像素比（Device Pixel Ratio）
                             // 用于处理高分辨率屏幕，确保图像清晰度
                             // 例如：在Retina屏幕上，dpr = 2，意味着1个CSS像素对应2个物理像素
      scale: 0,              // 当前缩放比例（0表示未设置）
      maxScale: 3.0,         // 最大缩放比例
      minScale: 0.1,         // 最小缩放比例
      adaptiveScale: 0,      // 自适应缩放比例（图片完全适应窗口）
      scaleStep: 0.1,        // 缩放步长

      /* 鼠标位置相关变量 */
      prevX: 0,              // 鼠标上一次的X坐标
      prevY: 0,              // 鼠标上一次的Y坐标
      currentX: 0,           // 鼠标当前的X坐标
      currentY: 0,           // 鼠标当前的Y坐标

      /* 缓存和引用变量 */
      currentImage: null,    // 当前加载的图片对象（HTMLImageElement）
      currentImageIndex: 0,  // 当前图片在数组中的索引
      targetImageIndex: -1,  // 目标图片索引（用于图片切换）
      wrapper: null,         // 画布容器的DOM引用
      canvas: null,          // 主画布的DOM引用
      bufferCanvas: null,    // 离屏画布的DOM引用（用于缓存绘制内容）
      currentRect: null,     // 当前正在创建的矩形对象
      selectedRect: null,    // 当前选中的矩形对象
      selectedRectIndex: -1, // 当前选中矩形在数组中的索引
      labelName: "",         // 标签名称
      rects: [],            // 当前图片的所有矩形标记数组
    };
  },
  mounted() {
    // 组件挂载后初始化
    this.init();
    // 添加浏览器窗口大小变化事件监听器
    // 当窗口大小改变时，重新加载图片以适应新的窗口尺寸
    window.addEventListener("resize", this.loadImage);
  },
  unmounted() {
    // 组件卸载时移除事件监听器，防止内存泄漏
    window.removeEventListener("resize", this.loadImage);
  },
  computed: {
    // 计算属性：获取当前图片的路径
    imagePath() {
      // 注释掉的代码是用于从服务器获取图片的示例
      // const path = "http://localhost:8000/static/" + this.images[this.currentImageIndex].url;
      return this.images[this.currentImageIndex].url;
    },
    // 计算属性：获取去重后的标签名集合
    uniqueName() {
      // 使用Set数据结构去重
      // Set是ES6提供的数据结构，自动去除重复值
      let names = new Set();
      this.rects.forEach(item => {
        names.add(item.name);
      });
      return names;
    },
  },
  methods: {
    // 初始化方法：设置组件的基本状态
    init() {
      // 获取设备像素比，用于处理高分辨率屏幕
      // 设备像素比 = 物理像素 / CSS像素
      // 例如：在Retina屏幕上，dpr = 2，意味着1个CSS像素对应2个物理像素
      this.dpr = window.devicePixelRatio || 1;

      // 获取画布及其所在容器元素的DOM引用
      this.canvas = this.$refs.canvas;        // 主画布
      this.wrapper = this.$refs.wrapper;      // 画布容器

      // 创建离屏画布（Off-screen Canvas）
      // 离屏画布是一个不在DOM中的Canvas，用于缓存绘制内容
      // 这样可以提高性能，避免重复绘制图片
      // document 是浏览器提供的全局对象，表示当前加载的网页文档。通过它可以直接访问和操作页面上的所有元素（如创建、修改、删除节点）。
      this.bufferCanvas = document.createElement('canvas');

      // 加载已保存的矩形标记
      this.loadRects();
      // 加载当前图片
      this.loadImage();
    },

    // 加载已保存的矩形标签：从浏览器本地存储中恢复标记数据
    loadRects() {
      // 从 sessionStorage 中获取保存的标记信息
      // sessionStorage 是浏览器提供的本地存储，数据在页面关闭后会被清除
      // JSON.parse 将JSON字符串转换回JavaScript对象
      const storedRects = JSON.parse(sessionStorage.getItem(this.images[this.currentImageIndex].id));
      if (storedRects !== null) {
        // 获取离屏画布的2D渲染上下文
        // getContext('2d')返回CanvasRenderingContext2D对象，提供绘图API
        const bufferCtx = this.bufferCanvas.getContext('2d');

        // 遍历保存的标记数据，重新创建矩形对象
        storedRects.forEach(item => {
          // 创建新的矩形对象，传入必要的参数
          // Rect类是我们自定义的矩形类，用于管理矩形的绘制和交互
          let rect = new Rect(bufferCtx, item.dpr, item.minX, item.minY, item.scale);

          // 恢复矩形的所有属性
          rect.changed = false;        // 标记为未修改
          rect.name = item.name;       // 标签名称
          rect.maxX = item.maxX;       // 右下角X坐标
          rect.maxY = item.maxY;       // 右下角Y坐标
          rect.timestamp = item.timestamp; // 时间戳（用于唯一标识）
          rect.realScale = item.realScale; // 实际缩放比例

          // 将矩形添加到数组中
          this.rects.push(rect);
        });
      }
    },

    // 加载当前图片：创建Image对象并设置加载事件
    loadImage() {
      // 创建新的Image对象
      // Image对象是HTML5提供的用于加载图片的API
      // 它继承自HTMLImageElement，可以加载各种格式的图片
      this.currentImage = new Image();

      // 设置图片源路径
      // 当设置src属性时，浏览器会开始异步加载图片
      this.currentImage.src = this.imagePath;

      // 设置图片加载完成事件
      // onload事件在图片完全加载后触发
      // 这是一个异步事件，确保图片数据完全可用后再进行后续操作
      // this.currentImage.onload = () => {
      //   // 图片加载完成后，调整图片尺寸以适应设备像素比
      //   // 这样可以确保在高分辨率屏幕上图片显示清晰
      //   // 例如：如果dpr=2，图片尺寸会翻倍，但CSS显示尺寸不变
      //   this.currentImage.width *= this.dpr;
      //   this.currentImage.height *= this.dpr;

      //   // 设置画布大小
      //   this.setSize();
      //   // 绘制画布内容
      //   this.drawCanvas();
      // };

      // 用 addEventListener 替代 onload
      this.currentImage.addEventListener('load', () => {
        this.currentImage.width *= this.dpr;
        this.currentImage.height *= this.dpr;
        this.setSize();
        this.drawCanvas();
      });

      // 设置图片加载失败事件
      // onerror事件在图片加载失败时触发
      this.currentImage.onerror = () => {
        console.error('图片加载失败:', this.imagePath);
        this.$message({
          showClose: true,
          message: '图片加载失败',
          type: 'error'
        });
      };
    },

    // 设置画布大小：根据图片尺寸和缩放比例计算画布大小
    setSize() {
      // 如果缩放比例未设置（初始状态）
      if (this.scale === 0) {
        /* 根据画布容器在浏览器中的实际宽高，计算图片缩放比例，从而等比缩放图片，保证图片不变形*/

        // 1.获取画布容器的实际宽高
        // clientWidth和clientHeight返回元素的内部尺寸，不包括边框和滚动条
        // 通过 DOM 属性（如 clientWidth、offsetWidth、getBoundingClientRect() 等）获取到的元素尺寸值，默认都是以 CSS 像素（逻辑像素）为单位的。这是浏览器为了屏蔽设备差异所做的标准化设计
        const width = this.wrapper.clientWidth * this.dpr;   // 转换为物理像素
        const height = this.wrapper.clientHeight * this.dpr;

        // 2.计算缩放比例
        // 分别计算宽度和高度的缩放比例，取较小值确保图片完全显示
        // 这样可以保持图片的宽高比，避免图片变形
        const scaleX = width / this.currentImage.width;
        const scaleY = height / this.currentImage.height;
        this.scale = Math.min(scaleX, scaleY);

        // 保存自适应缩放比例
        this.adaptiveScale = this.scale;
      }

      // 3.计算缩放后的图片尺寸
      const scaledWidth = this.currentImage.width * this.scale;
      const scaledHeight = this.currentImage.height * this.scale;

      // 4.设置canvas画布尺寸：本质是一个固定分辨率的像素缓冲区，其 width/height 属性直接决定了像素格子的数量，必须显式指定具体值。
      // 4.1 设置主画布的尺寸（图片尺寸）
      // Canvas的width和height属性设置的是画布的像素尺寸（物理像素）
      // 这决定了画布的分辨率和绘制精度
      this.canvas.width = scaledWidth;
      this.canvas.height = scaledHeight;

      // 4.2 设置主画布的CSS样式尺寸
      // style.width和style.height设置的是画布在页面中的显示尺寸（CSS像素）
      // 通过除以dpr，确保显示尺寸正确
      this.canvas.style.width = `${scaledWidth / this.dpr}px`;
      this.canvas.style.height = `${scaledHeight / this.dpr}px`;

      // 5.设置离屏画布的尺寸（与主画布保持一致）
      // 离屏画布用于缓存绘制内容，提高性能
      this.bufferCanvas.width = scaledWidth;
      this.bufferCanvas.height = scaledHeight;
      this.bufferCanvas.style.width = `${scaledWidth / this.dpr}px`;
      this.bufferCanvas.style.height = `${scaledHeight / this.dpr}px`;

      // 6.设置画布居中显示
      // Vue 的数据变化到 DOM 更新是异步的，直接操作 DOM 可能获取的是更新前的状态。
      // this.$nextTick 是 Vue.js 提供的内置方法，用于在DOM 更新完成后执行回调函数,将回调延迟到下次 DOM 更新循环之后执行，确保能访问到最新的 DOM。
      this.$nextTick(() => {
        // 垂直居中设置
        if (this.wrapper.clientHeight <= scaledHeight / this.dpr) {
          // 如果画布高度超过容器高度，取消居中
          this.wrapper.style.justifyContent = '';
        } else {
          // 否则设置垂直居中
          this.wrapper.style.justifyContent = 'center';
        }

        // 水平居中设置
        if (this.wrapper.clientWidth <= scaledWidth / this.dpr) {
          // 如果画布宽度超过容器宽度，取消居中
          this.wrapper.style.alignItems = '';
        } else {
          // 否则设置水平居中
          this.wrapper.style.alignItems = 'center';
        }
      });
    },

    // 绘制画布：在Canvas上绘制图片和所有矩形标记
    drawCanvas() {
      // 检查图片是否已加载完成
      // complete属性表示图片是否加载完成
      // naturalWidth表示图片的原始宽度，为0表示加载失败
      if (!this.currentImage || !this.currentImage.complete || this.currentImage.naturalWidth === 0) {
        return; // 图片未加载完成，不进行绘制
      }

      // 获取画布的2D渲染上下文
      // getContext('2d')返回CanvasRenderingContext2D对象，提供绘图API
      // 这是Canvas绘制的核心对象，包含所有绘图方法
      const ctx = this.canvas.getContext('2d');
      const bufferCtx = this.bufferCanvas.getContext('2d');

      // 获取画布的像素尺寸
      const width = this.canvas.width;
      const height = this.canvas.height;

      // 清空离屏画布
      // clearRect(x, y, width, height) 清除指定矩形区域
      // 参数：起始x坐标、起始y坐标、宽度、高度
      bufferCtx.clearRect(0, 0, width, height);

      // 在离屏画布上绘制缩放后的图片
      // drawImage(image, x, y, width, height) 在指定位置绘制图片
      // 参数：图片对象、目标x坐标、目标y坐标、目标宽度、目标高度
      bufferCtx.drawImage(this.currentImage, 0, 0, width, height);

      // 绘制当前正在创建的矩形（如果有）
      if (this.currentRect) {
        this.currentRect.draw(this.scale);
      }

      // 绘制所有已保存的矩形标记
      for (const rect of this.rects) {
        // 根据是否被选中设置不同的颜色
        if (rect === this.selectedRect) {
          rect.color = 'rgba(255, 0, 0, 0.3)';  // 选中状态：红色半透明
        } else {
          rect.color = 'rgba(0, 0, 255, 0.3)';  // 未选中状态：蓝色半透明
        }
        rect.draw(this.scale);
      }

      // 将离屏画布的内容绘制到主画布上
      // 这样可以避免重复绘制图片，提高性能
      // 离屏画布作为缓存，只绘制一次图片，然后复制到主画布
      ctx.drawImage(this.bufferCanvas, 0, 0, width, height);
    },

    // 鼠标按下事件处理：开始创建标记或选择已有标记
    handleMouseDown(e) {
      // 检查图片是否已加载完成
      if (!this.currentImage || !this.currentImage.complete || this.currentImage.naturalWidth === 0) {
        return; // 图片未加载完成，不处理鼠标事件
      }

      // 获取鼠标在Canvas中的坐标
      // offsetX和offsetY是相对于Canvas元素的坐标（CSS像素）
      // 这些坐标是相对于Canvas左上角的位置
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      // 记录鼠标位置，用于后续计算
      this.prevX = mouseX;
      this.prevY = mouseY;

      // 重置选中状态
      this.selectedRect = null;
      this.selectedRectIndex = -1;

      // 从后往前遍历矩形数组，检查鼠标是否点击了某个矩形
      // 从后往前是为了优先选择上层的矩形（后绘制的矩形在上层）
      for (let i = this.rects.length - 1; i > -1; i--) {
        const rect = this.rects[i];
        // 调用矩形的isSelected方法判断是否被点击
        // 这个方法会检查鼠标坐标是否在矩形范围内
        if (rect.isSelected(mouseX, mouseY)) {
          this.selectedRect = rect;
          this.selectedRectIndex = i;
          break;
        }
      }

      if (this.creating) {
        // 如果处于创建模式，开始创建新矩形
        const bufferCtx = this.bufferCanvas.getContext('2d');
        // 创建新的矩形对象，传入起始坐标
        // Rect构造函数需要：渲染上下文、设备像素比、起始x坐标、起始y坐标、缩放比例
        this.currentRect = new Rect(bufferCtx, this.dpr, mouseX, mouseY, this.scale);
      } else if (this.selectedRect) {
        // 如果点击了已有矩形，开始拖动或缩放操作
        // mouseDown方法会记录鼠标按下时的状态，为后续拖动做准备
        this.selectedRect.mouseDown(mouseX, mouseY);
      }
    },

    // 鼠标移动事件处理：实时更新矩形大小或位置
    handleMouseMove(e) {
      // 检查图片是否已加载完成
      if (!this.currentImage || !this.currentImage.complete || this.currentImage.naturalWidth === 0) {
        return; // 图片未加载完成，不处理鼠标事件
      }

      // 获取鼠标在Canvas中的坐标
      // 为什么offset是相对于canvas的坐标
      // 在 JavaScript 中，offsetX 和 offsetY 返回的是鼠标事件相对于 事件目标元素（即触发事件的元素）的坐标。
      // 当您在 <canvas> 元素上监听鼠标事件（如 mousedown、mousemove）时，offsetX/Y 会自动计算出相对于该 Canvas 左上角的坐标，无需手动转换
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;

      // 更新当前鼠标位置（用于显示坐标信息）
      this.currentX = mouseX;
      this.currentY = mouseY;

      // 获取主画布的2D渲染上下文
      const ctx = this.canvas.getContext('2d');

      if (this.creating) {
        // 如果处于创建模式，实时更新矩形大小
        // 清空主画布，准备重新绘制
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 从离屏画布复制背景图片，避免重复绘制图片
        ctx.drawImage(this.bufferCanvas, 0, 0);

        // 绘制交叉辅助线，帮助用户精确定位
        // 这些线条会跟随鼠标移动，提供视觉参考
        ctx.beginPath();  // 开始绘制路径
        ctx.moveTo(mouseX * this.dpr, 0);  // 移动到起点（垂直线）
        ctx.lineTo(mouseX * this.dpr, this.canvas.height);  // 绘制垂直线
        ctx.moveTo(0, mouseY * this.dpr);  // 移动到起点（水平线）
        ctx.lineTo(this.canvas.width, mouseY * this.dpr);   // 绘制水平线
        ctx.strokeStyle = 'red';  // 设置线条颜色
        ctx.stroke();  // 执行绘制

        // 如果当前矩形对象不存在，直接返回
        if (!this.currentRect) return;

        // 更新矩形的右下角坐标
        // 这样矩形会跟随鼠标移动实时改变大小
        this.currentRect.maxX = mouseX;
        this.currentRect.maxY = mouseY;
      } else if (this.selectedRect) {
        // 如果选中了矩形，处理拖动或缩放操作
        // mouseMove方法会根据鼠标移动更新矩形位置或大小
        this.selectedRect.mouseMove(e, this);
      }

      // 如果画布状态发生变化，重新渲染
      if (this.creating || this.selectedRect) {
        this.drawCanvas(); // 重新绘制背景和已有矩形
      }
    },

    // 鼠标抬起事件处理：完成矩形创建或操作
    handleMouseUp(e) {
      // 检查图片是否已加载完成
      if (!this.currentImage || !this.currentImage.complete || this.currentImage.naturalWidth === 0) {
        return; // 图片未加载完成，不处理鼠标事件
      }

      if (this.creating) {
        // 如果处于创建模式，完成矩形创建
        this.currentRect.maxX = e.offsetX;
        this.currentRect.maxY = e.offsetY;
        this.creating = false;  // 退出创建模式

        // 检查矩形是否有效（宽度和高度都不为0）
        if (this.currentRect.minX !== this.currentRect.maxX
            && this.currentRect.minY !== this.currentRect.maxY) {
          // 显示标签命名弹窗
          this.showNameInput = true;
        }
      } else if (this.selectedRect) {
        // 如果选中了矩形，完成拖动或缩放操作
        this.selectedRect.mouseUp(this.currentImage.width, this.currentImage.height);
      }

      // 重新绘制画布
      this.drawCanvas();
    },

    // 处理标签输入：确认创建新标记
    handleInputLabel() {
      if (this.labelName !== "") {
        // 显示成功消息
        this.$message({
          showClose: true,
          message: '创建成功',
          type: 'success'
        });

        // 设置矩形名称
        this.currentRect.name = this.labelName;
        // 将矩形添加到数组中
        this.rects.push(this.currentRect);

        console.log('当前存在矩形', this.rects);

        // 标记画布已发生变化
        this.canvasChanged = true;
      } else {
        // 显示错误消息
        this.$message({
          showClose: true,
          message: '名称不能为空',
          type: 'error'
        });
      }

      // 清理状态
      this.currentRect = null;
      this.showNameInput = false;
      // 重新绘制画布
      this.drawCanvas();
    },

    // 取消标签输入：取消创建新标记
    handleCancelInput() {
      // 清理状态
      this.currentRect = null;
      this.showNameInput = false;
      // 重新绘制画布
      this.drawCanvas();
    },

    // 保存标签：将标记数据保存到本地存储
    handleSaveLabel() {
      if (this.canvasChanged) {
        // 遍历所有矩形，处理已修改的矩形
        this.rects.forEach(item => {
          if (item.changed) {
            item.changed = false;  // 重置修改标记

            // 将矩形坐标归一化（转换为0-1之间的比例）
            // 这样可以保证在不同尺寸下标记位置的一致性
            // 例如：如果矩形在图片中心，无论图片多大，归一化后的坐标都是(0.5, 0.5)
            const {x, y, w, h} = item.normalize(this.currentImage.width, this.currentImage.height);

            // TODO 可以发送请求对归一化后的标签进行保存
            // 归一化后的坐标可以用于机器学习模型训练
            console.log("归一化后的参数：", `x: ${x}, y: ${y}, w: ${w}, h: ${h}`);
          }
        });
        this.canvasChanged = false;
      }

      // 将矩形数据保存到sessionStorage
      // sessionStorage是浏览器提供的本地存储API
      // JSON.stringify将JavaScript对象转换为JSON字符串
      // 数据会在页面关闭后自动清除，适合临时存储
      sessionStorage.setItem(this.images[this.currentImageIndex].id, JSON.stringify(this.rects));

      // 显示成功消息
      this.$message({
        showClose: true,
        message: '保存成功',
        type: 'success'
      });
    },

    // 删除选中标签：从数组中移除指定的矩形
    handleDeleteLabel(row) {
      // 根据时间戳找到要删除的矩形索引
      for (let i = 0; i < this.rects.length; i++) {
        if (row.timestamp === this.rects[i].timestamp) {
          this.selectedRectIndex = i;
          break;
        }
      }

      // 从数组中移除矩形
      this.rects.splice(this.selectedRectIndex, 1);
      // 标记画布已发生变化
      this.canvasChanged = true;
      // 重置选中状态
      this.selectedRectIndex = -1;

      // 显示成功消息
      this.$message({
        showClose: true,
        message: '删除成功',
        type: 'success'
      });

      // 重新绘制画布
      this.drawCanvas();
    },

    // 处理保存变更：用户选择是否保存当前修改
    handleSaveChange(flag) {
      this.showSaveAlert = false;
      if (flag) {
        // 如果用户选择保存，先保存到sessionStorage
        sessionStorage.setItem(this.images[this.currentImageIndex].id, JSON.stringify(this.rects));
        // 然后调用保存方法
        this.handleSaveLabel();
      }
      // 执行图片切换
      this.executeSwitch();
    },

    // 图片缩放：调整图片的显示比例
    zoom(scale) {
      this.scale = scale;

      // 限制缩放比例在合理范围内
      // 防止缩放过大导致性能问题，或过小导致看不清
      if (this.scale > this.maxScale) {
        this.scale = this.maxScale;  // 最大缩放3倍
      }
      if (this.scale < this.minScale) {
        this.scale = this.minScale;  // 最小缩放0.1倍
      }

      // 重新加载图片以应用新的缩放比例
      // 这会触发setSize()重新计算画布尺寸，然后重新绘制
      this.loadImage();
    },

    // 图片切换：切换到上一张或下一张图片
    handleImageSwitch(index) {
      const length = this.images.length;
      // 检查当前画布是否有未保存的修改
      this.checkChanged();

      // 计算目标图片索引，使用取模运算实现循环切换
      // 例如：当前是第2张图片，点击"下一张"，index=3，length=2，结果：(3+2)%2=1，切换到第1张
      // 这样实现了图片列表的循环浏览
      this.targetImageIndex = (index + length) % length;

      if (this.canvasChanged) {
        // 如果有未保存的修改，显示保存提示
        // 防止用户意外丢失标记数据
        this.showSaveAlert = true;
      } else {
        // 否则直接执行切换
        this.executeSwitch();
      }
    },

    // 执行图片切换：实际执行切换操作
    executeSwitch() {
      // 重置状态
      this.canvasChanged = false;
      this.currentImageIndex = this.targetImageIndex;
      this.rects = [];        // 清空当前图片的矩形数组
      this.scale = 0;         // 重置缩放比例，让setSize重新计算
      this.currentImage = null; // 重置图片对象，确保重新加载

      // 加载新图片的标记和图片
      this.loadRects();       // 从本地存储加载新图片的标记
      this.loadImage();       // 加载新图片
    },

    // 检查画布状态是否发生变化：遍历所有矩形检查是否有修改
    checkChanged() {
      for (let i = 0; i < this.rects.length; i++) {
        if (this.rects[i].changed) {
          this.canvasChanged = true;
          break;
        }
      }
    },

    // 标签所在行单元格样式：为选中的行添加高亮样式
    rectCellClass({row, column, rowIndex, columnIndex}) {
      // 利用单元格的样式的回调方法，给行列索引赋值
      // Element UI表格的cell-class-name回调函数，用于动态设置单元格样式
      row.index = rowIndex;
      column.index = columnIndex;

      // 如果当前行是选中的矩形，返回高亮样式类名
      // 这样可以在表格中高亮显示当前选中的标记
      if (this.selectedRectIndex === rowIndex) {
        return 'cell-clicked';
      }
      return '';
    },

    // 点击标签所在行：选中对应的矩形
    rectCellClick(row, column, cell, event) {
      // 设置选中的矩形索引
      this.selectedRectIndex = row.index;
      // 设置选中的矩形对象
      this.selectedRect = this.rects[row.index];
      // 重新绘制画布以显示选中效果
      // 选中的矩形会显示为红色，未选中的显示为蓝色
      this.drawCanvas();
    },

    // 图片路径单元格样式：为当前图片添加高亮样式
    imageCellClass({row, column, rowIndex, columnIndex}) {
      // 利用单元格的样式的回调方法，给行列索引赋值
      row.index = rowIndex;
      column.index = columnIndex;

      // 如果当前行是当前图片，返回高亮样式类名
      // 这样可以在图片列表中高亮显示当前正在编辑的图片
      if (this.currentImageIndex === rowIndex) {
        return 'cell-clicked';
      }
      return '';
    },

    // 点击图片路径单元格：切换到对应的图片
    imageCellClick(row, column, cell, event) {
      // 调用图片切换方法
      // 用户可以通过点击图片列表中的任意图片来切换
      this.handleImageSwitch(row.index);
    },
  }
};
</script>

<style scoped>
/* 主容器：使用flex布局，占满95%的视口高度 */
.container {
  display: flex;
  height: 95vh;
}

/* 左右两侧区域的基本样式 */
.left,
.right {
  height: 100%;
  flex: 20%;          /* 默认各占20%宽度 */
  padding: 1vw;       /* 内边距使用视口宽度单位 */
  overflow-y: auto;   /* 内容溢出时显示垂直滚动条 */
  display: flex;
  flex-direction: column;
}

/* 左侧区域：占据80%宽度，用于显示图片和工具栏 */
.left {
  flex: 80%;
}

/* 左侧顶部：图片显示区域 */
.left-top {
  flex: 90%;          /* 占据90%高度 */
  height: 94vh;
  margin-top: 3vh;
  display: flex;
  flex-direction: column;
  overflow: auto;     /* 图片过大时显示滚动条 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
}

/* 左侧底部：工具栏区域 */
.left-bottom {
  margin-top: 1vh;
  padding: 1vh;
  display: flex;
  justify-content: center;  /* 水平居中 */
  justify-items: center;    /* 垂直居中 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
}

/* 右侧卡片：标签列表和图片列表 */
.right > .label-list,
.right > .image-list {
  flex: 50%;          /* 平分高度 */
  overflow-y: auto;   /* 内容溢出时显示滚动条 */
  margin-bottom: 10px;
}

/* 选中单元格的高亮样式 */
::v-deep .cell-clicked {
  background: #fdf5e6 !important;  /* 浅橙色背景 */
}
</style>
