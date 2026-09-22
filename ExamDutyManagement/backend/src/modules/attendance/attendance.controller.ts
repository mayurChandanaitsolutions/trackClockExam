import {
  Controller,
  Get,
  Post,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { extname } from 'path';
import * as fs from 'fs';
import { AttendanceService } from './attendance.service';

const uploadDir = './uploads/attendance';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('attendance/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `attendance-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(pdf|png|jpg|jpeg)$/i)) {
          return callback(
            new BadRequestException('Only PDF and image files (PNG, JPG) are allowed.'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadAttendance(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please select an attendance file to upload.');
    }

    const savedFile = await this.attendanceService.saveFileMetadata(file);

    return {
      status: 'ok',
      message: 'Attendance uploaded successfully',
      file: {
        id: savedFile.id,
        originalName: savedFile.originalName,
        fileName: savedFile.fileName,
        size: savedFile.size,
        mimeType: savedFile.mimeType,
      },
    };
  }

  @Post('duties/:id/attendance')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `duty-${req.params.id}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadDutyAttendance(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Please select an attendance file to upload.');
    }

    const savedFile = await this.attendanceService.saveFileMetadata(file, id);

    return {
      status: 'ok',
      message: 'Attendance uploaded successfully and linked to duty',
      file: {
        id: savedFile.id,
        originalName: savedFile.originalName,
        fileName: savedFile.fileName,
        size: savedFile.size,
      },
    };
  }

  @Get('attendance/file/:id')
  async getAttendanceFile(@Param('id') id: string, @Res() res: any) {
    let file = await this.attendanceService.getFileById(id);
    if (!file) {
      file = await this.attendanceService.getFileByFileName(id);
    }
    if (!file) {
      // Check if this id matches a physical file name in uploads
      const directPath = path.join(uploadDir, path.basename(id));
      if (fs.existsSync(directPath)) {
        const ext = path.extname(id).toLowerCase();
        const mime =
          ext === '.png'
            ? 'image/png'
            : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : 'application/pdf';
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', `inline; filename="${path.basename(id)}"`);
        return fs.createReadStream(directPath).pipe(res);
      }
      throw new NotFoundException('Attendance file not found');
    }

    const filePath = path.resolve(file.filePath);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File on disk not found');
    }

    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    fs.createReadStream(filePath).pipe(res);
  }

  @Get('attendance/view-by-name/:fileName')
  async viewByFileName(@Param('fileName') fileName: string, @Res() res: any) {
    const safeName = path.basename(fileName);
    const filePath = path.join(uploadDir, safeName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    const ext = path.extname(safeName).toLowerCase();
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : 'application/pdf';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    fs.createReadStream(filePath).pipe(res);
  }
}
