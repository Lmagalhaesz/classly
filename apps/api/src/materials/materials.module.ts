import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { VideoController } from "./videos/video.controller";
import { PdfController } from "./pdfs/pdf.controller";
import { PlaylistController } from "./playlists/playlist.controller";
import { VideoService } from "./videos/video.service";
import { PdfMaterialService } from "./pdfs/pdf.service";
import { PlaylistService } from "./playlists/playlist.service";

@Module({
  imports: [PrismaModule],
  controllers: [VideoController, PdfController, PlaylistController],
  providers: [VideoService, PdfMaterialService, PlaylistService],
})
export class MaterialsModule {}