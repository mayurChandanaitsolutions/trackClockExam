import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceFile, Duty } from '../../entities';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceFile)
    private readonly fileRepo: Repository<AttendanceFile>,
    @InjectRepository(Duty)
    private readonly dutyRepo: Repository<Duty>,
  ) {}

  async saveFileMetadata(file: Express.Multer.File, dutyId?: string): Promise<AttendanceFile> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    const attendanceFile = this.fileRepo.create({
      originalName: file.originalname,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      filePath: file.path.replace(/\\/g, '/'),
    });

    const savedFile = await this.fileRepo.save(attendanceFile);

    if (dutyId) {
      await this.dutyRepo.update(dutyId, { attendanceFileId: savedFile.id });
    }

    return savedFile;
  }

  async getFileById(id: string): Promise<AttendanceFile | null> {
    return this.fileRepo.findOne({ where: { id } });
  }

  async getFileByFileName(fileName: string): Promise<AttendanceFile | null> {
    return this.fileRepo.findOne({ where: { fileName } });
  }
}
