import { Annotation } from './Annotation';
import { AnnotationCategory } from './annotation-category';
import { Category } from './Category';
import { Evidence } from './Evidence';
import { Vote } from './Vote';

export interface AnnotationDetail {
  annotation: Annotation;
  votes: Vote[];
  evidences: Evidence[];
  categories: Category[];
  relations: AnnotationCategory[];
}
